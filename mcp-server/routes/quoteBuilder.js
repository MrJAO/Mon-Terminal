// routes/quoteBuilder.js
import express from 'express'
import { getQuote } from '../api/quoteService.js'

const router = express.Router()

// POST route (main quote endpoint)
router.post('/', async (req, res) => {
  const { from, to, amount, sender } = req.body
  if (!from || !to || !amount || !sender) {
    return res.status(400).json({ success: false, error: 'Missing parameters' })
  }

  try {
    const quote = await getQuote({ from, to, amount, sender })
    return res.json({ success: true, quote })
  } catch (err) {
    console.error('❌ QuoteBuilder error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

// ✅ Add this test route temporarily
router.get('/test', (req, res) => {
  res.send('🧪 quoteBuilder is active')
})

export default router
