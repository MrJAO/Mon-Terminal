// api/token-report.js
import express from 'express'
import { getTokenReport } from '../utils/tokenReport.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const { symbol } = req.body
  if (!symbol) {
    return res.status(400).json({ success: false, error: 'Missing token symbol.' })
  }

  try {
    // getTokenReport returns { symbol, prices: [...], percentChange, sentiment }
    const report = await getTokenReport(symbol)

    // we only need to send back the 7-day price array
    return res.json({ success: true, data: report.prices })

  } catch (err) {
    console.error('❌ /api/token-report error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
