// api/best-price.js
import express from 'express'
import { ethers } from 'ethers'
import { getQuote } from '../services/swapService.js'
import TOKEN_LIST from '../../src/constants/tokenList.js'

const router = express.Router()

// Use zero address when sender is not specified
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// POST /api/best-price
// body: { symbol, to, sender }
router.post('/', async (req, res) => {
  try {
    // Normalize inputs
    const symbol   = String(req.body.symbol || '').trim().toUpperCase()
    const toSymbol = String(req.body.to     || 'USDC').trim().toUpperCase()
    const sender   = String(req.body.sender || ZERO_ADDRESS).trim()

    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Missing token symbol.' })
    }

    // Find token metadata
    const token   = TOKEN_LIST.find(t => t.symbol.toUpperCase() === symbol)
    const toToken = TOKEN_LIST.find(t => t.symbol.toUpperCase() === toSymbol)

    if (!token) {
      return res.status(400).json({ success: false, error: 'Invalid token symbol.' })
    }
    if (!toToken) {
      return res.status(400).json({ success: false, error: 'Invalid destination token symbol.' })
    }

    // Build raw amount for 1 token (using 18 decimals)
    const rawAmount = ethers.parseUnits('1', 18).toString()

    // Fetch a quote from Monorail
    const data = await getQuote(token.address, toToken.address, rawAmount, sender)
    const price = parseFloat(data.quote.output_formatted)

    if (isNaN(price)) {
      return res.status(404).json({
        success: false,
        error: 'Invalid price data from Monorail'
      })
    }

    // Respond with a standardized shape
    return res.status(200).json({
      success: true,
      data: {
        symbol: token.symbol,
        to:     toToken.symbol,
        pricePerUnit: parseFloat(price.toFixed(6)),
        source: 'monorail-pathfinder'
      },
      note: 'Thanks Monorail API team for making this quote available 🧠✨'
    })
  } catch (err) {
    console.error('❌ Monorail quote error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
