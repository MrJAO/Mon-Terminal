// api/best-price.js
import express from 'express'
import { getQuote } from '../services/swapService.js'

const router = express.Router()

// POST /api/best-price
// body: { symbol, to, sender }
router.post('/', async (req, res) => {
  try {
    const { symbol, to, sender } = req.body
    if (!symbol || !to || !sender) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameters: symbol, to, and sender are all required'
      })
    }

    // Quote 1 token (raw amount = 1 * 10**decimals; swapService parses decimals internally)
    const quote = await getQuote(symbol, to, '1000000000000000000', sender)
    const pricePerUnit = Number(quote.amountOut) / 10**6

    return res.status(200).json({
      success: true,
      data: {
        symbol,
        to,
        pricePerUnit
      }
    })
  } catch (err) {
    console.error('❌ /api/best-price error:', err)
    return res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

export default router
