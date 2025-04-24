// routes/analyze.js
import express from 'express'
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import { tokenContracts, nftContracts } from '../helpers/analyzeContracts.js'

dotenv.config()

const router = express.Router()
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY
const BASE_URL = `https://monad-testnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`

function isValidAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

// Paginated transfer fetcher
async function fetchAllTransfers(params) {
  const transfers = []
  let pageKey = null
  let tries = 0

  do {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [{ ...params, pageKey }]
      })
    })

    if (!res.ok) throw new Error(`Alchemy error: ${res.status} ${await res.text()}`)
    const json = await res.json()
    if (json.error) throw new Error(json.error.message)

    transfers.push(...(json.result?.transfers || []))
    pageKey = json.result?.pageKey || null

    tries++
  } while (pageKey && tries < 10)

  return transfers
}

// Full transaction count
async function getTransactionCount(address) {
  const transfers = await fetchAllTransfers({
    fromAddress: address,
    category: ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
    excludeZeroValue: true,
    withMetadata: false,
    maxCount: '0x3e8'
  })
  return transfers.length
}

// Token interactions (from OR to address)
async function getTokenInteractionCount(address, tokenAddress) {
  const transfers = await fetchAllTransfers({
    contractAddresses: [tokenAddress],
    category: ['erc20'],
    withMetadata: false,
    maxCount: '0x3e8',
    toAddress: address,
    fromAddress: address
  })
  return transfers.length
}

// Paginated NFT fetcher
async function getNFTs(address) {
  const all = []
  let pageKey = null
  let tries = 0

  do {
    const url = new URL(`${BASE_URL}/getNFTs/`)
    url.searchParams.set('owner', address)
    url.searchParams.set('withMetadata', 'false')
    if (pageKey) url.searchParams.set('pageKey', pageKey)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Alchemy NFT error: ${res.status} ${await res.text()}`)
    const json = await res.json()
    if (json.error) throw new Error(json.error.message)

    const owned = json.ownedNfts || json.ownedNFTs || []
    all.push(...owned)
    pageKey = json.pageKey
    tries++
  } while (pageKey && tries < 10)

  return all
}

router.post('/', async (req, res) => {
  try {
    const { address, command } = req.body

    if (command !== 'analyze' || !isValidAddress(address)) {
      return res.status(400).json({ error: 'Invalid command or address' })
    }

    const totalTxCount = await getTransactionCount(address)
    let activityLevel = 'Low'
    if (totalTxCount >= 5000) activityLevel = 'High'
    else if (totalTxCount >= 1000) activityLevel = 'Intermediate'
    else if (totalTxCount >= 200) activityLevel = 'Fair'

    const tokenStats = {}
    for (const token of tokenContracts) {
      tokenStats[token.symbol] = await getTokenInteractionCount(address, token.address)
    }

    const nfts = await getNFTs(address)

    const nftHoldings = Object.entries(nftContracts).map(([label, data]) => {
      const addr = typeof data === 'string' ? data : data.address
      const threshold = typeof data === 'string' ? 1 : data.threshold || 1
      const matchCount = nfts.filter(n => n.contract?.address?.toLowerCase() === addr.toLowerCase()).length
      const status = matchCount >= threshold ? 'Confirm'
                    : matchCount > 0 ? 'Incomplete'
                    : 'Not Holding'
      return { name: label, count: matchCount, status }
    })

    return res.json({
      totalTxCount,
      activityLevel,
      tokenStats,
      nftHoldings
    })

  } catch (err) {
    console.error('❌ Analyze error:', err)
    return res.status(500).json({ error: err.message })
  }
})

export default router
