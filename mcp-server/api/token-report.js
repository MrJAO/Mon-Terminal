// api/token-report.js
import express from 'express'
import { getTokenReport } from '../utils/tokenReport.js'

const router = express.Router()

// POST /api/report  (token-report)
router.post('/', async (req, res) => {
  // Normalize and validate symbol
  const symbol = String(req.body.symbol || '').trim().toUpperCase()
  if (!symbol) {
    return res.status(400).json({
      success: false,
      error: 'Missing token symbol.'
    })
  }

  try {
    // Fetch 7-day price history
    const prices = await getTokenReport(symbol)

    if (!Array.isArray(prices) || prices.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No price history found for ${symbol}`
      })
    }

    // Return normalized response
    return res.status(200).json({
      success: true,
      data: prices,
      source: 'coingecko',
      note: 'Thanks Monorail API team for powering the token reports 🧠✨'
    })
  } catch (err) {
    console.error('❌ Token report error:', err)
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error'
    })
  }
})

export default router
