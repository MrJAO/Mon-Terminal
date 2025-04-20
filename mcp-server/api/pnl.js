// mcp-server/api/pnl.js
import express from 'express'
import { getWalletPnL } from '../utils/getWalletPnL.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const { address, token } = req.body

  if (!address || !token) {
    return res.status(400).json({
      success: false,
      error: 'Missing wallet address or token symbol.',
    })
  }

  try {
    const pnlData = await getWalletPnL(address, token)

    if (!Array.isArray(pnlData) || pnlData.length === 0 || pnlData[0]?.error) {
      return res.status(404).json({
        success: false,
        error: pnlData[0]?.error || `No PnL data found for ${token.toUpperCase()}`,
      })
    }

    return res.json({ success: true, pnl: pnlData })
  } catch (error) {
    console.error(`❌ Error in /api/pnl for ${token}:`, error?.stack || error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    })
  }
})

export default router
