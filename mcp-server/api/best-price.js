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

    // 3) Build raw amount for 1 unit using 18 decimals
    const rawAmt = ethers.parseUnits('1', 18).toString()
    console.log(`> best-price rawAmt: ${rawAmt}`)

    // 4) Fetch the quote
    let quoteData
    try {
      quoteData = await getQuote(token.address, toToken.address, rawAmt, sender)
    } catch (err) {
      throw new Error(`Monorail quote failed: ${err.message}`)
    }

    // 5) Normalize response shape
    const rawQuote = quoteData.quote ?? quoteData
    if (typeof rawQuote.output !== 'string') {
      throw new Error('Malformed quote response from Monorail')
    }

    // 6) Extract and log formatted output
    const formatted = rawQuote.output_formatted ?? ethers.formatUnits(rawQuote.output, 6)
    console.log(`> best-price raw output: ${rawQuote.output}, formatted: ${formatted}`)

    if (typeof formatted !== 'string') {
      throw new Error('Malformed quote response from Monorail')
    }

    // 7) Respond with parsed number
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
