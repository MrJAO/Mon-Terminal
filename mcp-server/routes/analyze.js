// mon-terminal/mcp-server/routes/analyze.js
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { ethers } from 'ethers'
import { Alchemy, Network } from 'alchemy-sdk'
import dexContracts from './dexContracts.js'

const router = express.Router()

const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL)

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_GOERLI,
})

router.post('/', async (req, res) => {
  const body = req.body || {}
  const address = typeof body.address === 'string' ? body.address.toLowerCase() : null
  if (!address) {
    return res.status(400).json({ success: false, message: 'Invalid or missing wallet address.' })
  }

  try {
    console.log(`🔍 Analyzing address: ${address}`)

    const totalTxCount = await provider.getTransactionCount(address)
    console.log(`📊 Total transactions: ${totalTxCount}`)

    const latestBlock = await provider.getBlockNumber()
    const blocksPerDay = 7200
    const scanDepth = blocksPerDay * 0.1
    const fromBlock = Math.max(0, Math.floor(latestBlock - scanDepth))

    console.log(`⛓️ Scanning blocks ${fromBlock}-${latestBlock} for DEX interactions`)

    const recentDexCounts = {}
    for (const name of Object.keys(dexContracts)) recentDexCounts[name] = 0

    for (let blockNumber = fromBlock; blockNumber <= latestBlock; blockNumber++) {
      if ((blockNumber - fromBlock) % 50 === 0) {
        console.log(`🌀 Progress: at block ${blockNumber}`)
      }

      let block
      try {
        block = await provider.getBlock(blockNumber, true)
      } catch (err) {
        console.warn(`⚠️ Failed to fetch block ${blockNumber}: ${err.message}`)
        continue
      }

      if (!block || !block.transactions || block.transactions.length === 0) {
        console.warn(`⚠️ Block ${blockNumber} has no transactions or could not be fetched.`)
        continue
      }

      for (const tx of block.transactions) {
        if ((tx.from?.toLowerCase() === address || tx.to?.toLowerCase() === address) && tx.data) {
          const methodId = tx.data.slice(0, 10)
          console.log(`🔎 TX ${tx.hash} uses methodId: ${methodId}`)

          let matched = false
          for (const [dexName, dexInfo] of Object.entries(dexContracts)) {
            const expectedMethodId = dexInfo.methodId?.toLowerCase()
            const expectedAddress = dexInfo.address?.toLowerCase()
            const txTo = tx.to?.toLowerCase()

            const isMethodMatch = methodId === expectedMethodId
            const isToAddressMatch = txTo === expectedAddress

            if (isMethodMatch || isToAddressMatch) {
              recentDexCounts[dexName]++
              matched = true
              console.log(`✅ Matched ${dexName} at block ${blockNumber}`)
              break
            }
          }

          if (!matched) {
            console.warn(`❌ No DEX match for methodId ${methodId} in tx ${tx.hash}`)
          }
        }
      }
    }

    let nftHoldings = { total: 0, verified: 0, unverified: 0 }
    try {
      console.log(`🎨 Fetching NFTs via Alchemy`)
      const nftResponse = await alchemy.nft.getNftsForOwner(address)
      const allNfts = nftResponse.ownedNfts || []
      const verifiedContracts = [ '0xabc123...', '0xdef456...' ]
      const verified = allNfts.filter(n =>
        verifiedContracts.includes(n.contract.address.toLowerCase())
      ).length
      nftHoldings = { total: allNfts.length, verified, unverified: allNfts.length - verified }
    } catch {
      console.warn('⚠️ Alchemy NFT fetch failed; using simulated data')
    }

    let activityLevel
    if (totalTxCount >= 5000)      activityLevel = 'High'
    else if (totalTxCount >= 1000) activityLevel = 'Intermediate'
    else if (totalTxCount >= 200)  activityLevel = 'Fair'
    else                            activityLevel = 'Low'

    console.log(`🔔 Activity level: ${activityLevel}`)

    return res.json({
      success: true,
      data: {
        address,
        transactionCount: totalTxCount,
        nftHoldings,
        activityLevel,
        disclaimer: 'Activity levels are purely for speculation only.',
        dexSummary: {
          label: "You've interacted with these DEXs for the past 12 hours:",
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