// mcp-server/routes/balance.js
import express from 'express'
import { getTokenBalance } from '../utils/getTokenBalance.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const { address, token } = req.body

  if (!address || !token) {
    return res.status(400).json({
      success: false,
      error: 'Missing address or token',
    })
  }

  try {
    const balance = await getTokenBalance(address, token)
    return res.json({ success: true, balance })
  } catch (err) {
    console.error('[balance] error:', err)
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    })
  }
})

export default router
