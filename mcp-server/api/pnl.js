// api/pnl.js
import express from 'express'
import { getWalletPnL } from '../utils/getWalletPnL.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const address = req.body.address?.trim()
    const token = req.body.token?.trim().toUpperCase()

    if (!address || !token) {
      return res.status(400).json({
        success: false,
        error: 'Missing wallet address or token symbol.',
      })
    }

    const pnlData = await getWalletPnL(address, token)

    if (!Array.isArray(pnlData) || pnlData.length === 0 || pnlData[0]?.error) {
      return res.status(404).json({
        success: false,
        error: pnlData[0]?.error || `No PnL data found for ${token}`,
      })
    }

    // Add source and normalize symbol
    pnlData[0].symbol = token
    pnlData[0].source = 'monorail'

    return res.status(200).json({
      success: true,
      data: {
        ...pnlData[0],
        symbol: token,
        source: 'monorail'
      }
    })    
  } catch (error) {
    console.error(`❌ Error in /api/pnl for ${req.body?.token}:`, error.stack || error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    })
  }
})

export default router
