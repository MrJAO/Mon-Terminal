// routes/analyze.js
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { ethers } from 'ethers'
import fetch from 'node-fetch'
import dexContracts from './dexContracts.js'

const router = express.Router()

router.use(cors())
router.use(express.json())

// Provider for Monad Testnet
const provider = new ethers.JsonRpcProvider(
  process.env.ALCHEMY_TESTNET_RPC_URL || 'https://testnet-rpc.monad.xyz',
  { chainId: 10143, name: 'monad-testnet' }
)

// Retry helper for robustness
async function retry(fn, retries = 2, delay = 500) {
  try {
    return await fn()
  } catch (err) {
    if (retries <= 0) throw err
    console.warn(`Retrying after failure: ${err.message}`)
    await new Promise(r => setTimeout(r, delay))
    return retry(fn, retries - 1, delay * 2)
  }
}

router.post('/', async (req, res) => {
  const address = typeof req.body.address === 'string'
    ? req.body.address.toLowerCase()
    : null

  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ success: false, message: 'Invalid or missing wallet address.' })
  }

  try {
    console.log(`🔍 Analyzing address: ${address}`)

    // Total transaction count
    const totalTxCount = await provider.getTransactionCount(address)

    // Determine block range (10% of a day's blocks)
    const latestBlock = await provider.getBlockNumber()
    const blocksPerDay = 7200
    const scanDepth = Math.floor(blocksPerDay * 0.1)
    const fromBlock = Math.max(0, latestBlock - scanDepth)

    // Initialize DEX interaction counters
    const recentDexCounts = Object.fromEntries(
      Object.keys(dexContracts).map(name => [name, 0])
    )

    // Scan each block in range
    for (let blockNumber = fromBlock; blockNumber <= latestBlock; blockNumber++) {
      if ((blockNumber - fromBlock) % 50 === 0) {
        console.log(`🌀 Scanning block ${blockNumber}...`)
      }

      // Fetch block with full transactions
      let block
      try {
        block = await retry(() =>
          provider.getBlockWithTransactions(blockNumber)
        )
      } catch (err) {
        console.warn(`⚠️ Block ${blockNumber} failed: ${err.message}`)
        continue
      }

      if (!block?.transactions?.length) continue

      // Inspect each transaction
      for (const tx of block.transactions) {
        const from = tx.from?.toLowerCase()
        const to = tx.to?.toLowerCase()
        const data = tx.data || ''

        // Only transactions involving the address with calldata
        if ((from === address || to === address) && data.length >= 10) {
          const methodId = data.slice(0, 10).toLowerCase()

          // Check against known DEX contracts and methods
          for (const [dexName, dexInfo] of Object.entries(dexContracts)) {
            if (
              to === dexInfo.address.toLowerCase() ||
              dexInfo.methodIds.map(i => i.toLowerCase()).includes(methodId)
            ) {
              recentDexCounts[dexName]++
              break
            }
          }
        }
      }
    }

    // NFT Holdings via Alchemy NFT API
    let nftHoldings = { total: 0, verified: 0, unverified: 0 }
    try {
      const nftRes = await fetch(
        `https://monad-testnet.g.alchemy.com/nft/v2/${process.env.ALCHEMY_API_KEY}/getNFTs?owner=${address}`
      )
      const nftData = await nftRes.json()
      const allNfts = nftData.ownedNfts || []

      // Customize your list of verified contract addresses
      const verifiedContracts = ['0xabc123...', '0xdef456...']
      const verified = allNfts.filter(n =>
        verifiedContracts.includes(n.contract.address.toLowerCase())
      ).length

      nftHoldings = {
        total: allNfts.length,
        verified,
        unverified: allNfts.length - verified
      }
    } catch (err) {
      console.warn('⚠️ NFT fetch failed:', err.message)
    }

    // Determine activity level
    const activityLevel =
      totalTxCount >= 5000 ? 'High' :
      totalTxCount >= 1000 ? 'Intermediate' :
      totalTxCount >= 200  ? 'Fair' : 'Low'

    return res.json({
      success: true,
      data: {
        address,
        transactionCount: totalTxCount,
        nftHoldings,
        activityLevel,
        disclaimer: 'Activity levels are speculative. Do your own research.',
        dexSummary: {
          label: 'DEX interactions scanned from past blocks:',
          interactions: recentDexCounts
        }
      }
    })
  } catch (error) {
    console.error('❌ Analyze error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
})

export default router
