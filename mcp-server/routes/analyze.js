// routes/analyze.js
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { ethers } from 'ethers'
import pkg from 'alchemy-sdk'
import dexContracts from './dexContracts.js'

const { Alchemy, Network } = pkg
const router = express.Router()

router.use(cors())
router.use(express.json())

// ✅ Correct network setting for Monad Testnet
const ALCHEMY_SETTINGS = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.MONAD_TESTNET // 🧠 Confirmed support
}

const alchemy = new Alchemy(ALCHEMY_SETTINGS)
const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL)

router.post('/', async (req, res) => {
  const address = typeof req.body.address === 'string'
    ? req.body.address.toLowerCase()
    : null

  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ success: false, message: 'Invalid or missing wallet address.' })
  }

  try {
    console.log(`🔍 Analyzing address: ${address}`)

    const totalTxCount = await provider.getTransactionCount(address)
    const latestBlock = await provider.getBlockNumber()
    const blocksPerDay = 7200
    const scanDepth = Math.floor(blocksPerDay * 0.1)
    const fromBlock = Math.max(0, latestBlock - scanDepth)

    const recentDexCounts = Object.fromEntries(
      Object.keys(dexContracts).map(name => [name, 0])
    )

    for (let blockNumber = fromBlock; blockNumber <= latestBlock; blockNumber++) {
      if ((blockNumber - fromBlock) % 50 === 0) {
        console.log(`🌀 Scanning block ${blockNumber}...`)
      }

      let block
      try {
        block = await provider.getBlock(blockNumber, true)
      } catch (err) {
        console.warn(`⚠️ Block ${blockNumber} failed: ${err.message}`)
        continue
      }

      if (!block?.transactions?.length) continue

      for (const tx of block.transactions) {
        if ((tx.from?.toLowerCase() === address || tx.to?.toLowerCase() === address) && tx.data) {
          const methodId = tx.data.slice(0, 10).toLowerCase()
          const txTo = tx.to?.toLowerCase()

          for (const [dexName, dexInfo] of Object.entries(dexContracts)) {
            if (
              txTo === dexInfo.address.toLowerCase() ||
              dexInfo.methodIds.map(i => i.toLowerCase()).includes(methodId)
            ) {
              recentDexCounts[dexName]++
              break
            }
          }
        }
      }
    }

    // ✅ NFT Holdings via Alchemy
    let nftHoldings = { total: 0, verified: 0, unverified: 0 }
    try {
      const nftResponse = await alchemy.nft.getNftsForOwner(address)
      const allNfts = nftResponse.ownedNfts || []
      const verifiedContracts = ['0xabc123...', '0xdef456...'] // Customize or expand as needed
      const verified = allNfts.filter(n =>
        verifiedContracts.includes(n.contract.address.toLowerCase())
      ).length
      nftHoldings = {
        total: allNfts.length,
        verified,
        unverified: allNfts.length - verified
      }
    } catch (err) {
      console.warn('⚠️ Alchemy NFT fetch failed:', err.message)
    }

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
