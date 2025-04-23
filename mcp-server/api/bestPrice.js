// api/bestPrice.js
import express from 'express'
import { getQuote } from '../services/swapService.js'

const router = express.Router()

// POST /api/best-price
// body: { symbol, stable, sender }
router.post('/', async (req, res) => {
  try {
    const { symbol, stable, sender } = req.body
    if (!symbol || !stable || !sender) {
      return res.status(400).json({ error: 'Missing parameters' })
    }
    const quote = await getQuote(symbol, stable, 1, sender)
    const best   = Number(quote.amountOut) / 10**6
    res.json({ bestPricePerUnit: best })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
