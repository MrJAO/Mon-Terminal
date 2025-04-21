// api/token-report.js
import express from 'express'
import { getTokenReport } from '../utils/tokenReport.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const { symbol } = req.body // Expecting token symbol in request body

  if (!symbol) {
    return res.status(400).json({
      success: false,
      error: 'Missing token symbol.',
    })
  }

  try {
    const result = await getTokenReport(symbol)

    if (result.error) {
      // Not found or fallback failed
      return res.status(404).json({ success: false, error: result.error })
    }

    // Return the token report under "data" to match client expectations
    return res.json({ success: true, data: result })
  } catch (err) {
    console.error('❌ Token report error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
