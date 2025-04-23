// api/best-price.js
import express from 'express'
import { ethers } from 'ethers'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { getQuote } from '../services/swapService.js'

const router = express.Router()
const ZERO = '0x0000000000000000000000000000000000000000'

router.post('/', async (req, res) => {
  try {
    // 1) Normalize inputs
    const symbol   = (req.body.symbol || '').trim().toUpperCase()
    const toSymbol = (req.body.to     || 'USDC').trim().toUpperCase()
    const sender   = (req.body.sender || ZERO).trim()

    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Missing token symbol.' })
    }

    // 2) Lookup tokens
    const token   = TOKEN_LIST.find(t => t.symbol.toUpperCase() === symbol)
    const toToken = TOKEN_LIST.find(t => t.symbol.toUpperCase() === toSymbol)

    if (!token) {
      return res.status(400).json({ success: false, error: 'Invalid token symbol.' })
    }
    if (!toToken) {
      return res.status(400).json({ success: false, error: 'Invalid destination symbol.' })
    }

    // 3) Fetch a 1‐unit quote
    const rawAmt = ethers.parseUnits('1', token.decimals || 18).toString()
    let quoteData
    try {
      quoteData = await getQuote(token.address, toToken.address, rawAmt, sender)
    } catch (err) {
      throw new Error(`Monorail quote failed: ${err.message}`)
    }

    // 4) Extract output_formatted or fall back to raw `output`
    let formatted = quoteData?.quote?.output_formatted
    if (typeof formatted !== 'string') {
      const rawOut = quoteData?.quote?.output ?? quoteData?.output
      if (typeof rawOut === 'string') {
        // format raw big‐number with the destination token decimals
        formatted = ethers.formatUnits(rawOut, toToken.decimals || 6)
      }
    }
    if (typeof formatted !== 'string') {
      throw new Error('Malformed quote response from Monorail')
    }

    // 5) Respond with parsed number
    const pricePerUnit = parseFloat(formatted)
    return res.json({
      success: true,
      data: { symbol: token.symbol, to: toToken.symbol, pricePerUnit },
      source: 'monorail-pathfinder'
    })

  } catch (err) {
    console.error('❌ /api/best-price error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
