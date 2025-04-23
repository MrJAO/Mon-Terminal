// api/pnl.js
import express from 'express'
import { getWalletPnL } from '../utils/getWalletPnL.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    // 1) Extract & normalize
    const address = String(req.body.address || '').trim()
    const token   = String(req.body.token   || '').trim().toUpperCase()
    const amount  = Number(req.body.amount  ?? 1)
    const to      = String(req.body.to      || 'USDC').trim().toUpperCase()

    // 2) Validate
    if (!address || !token) {
      return res.status(400).json({
        success: false,
        error: 'Missing wallet address or token symbol.'
      })
    }
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount; must be a positive number.'
      })
    }

    // 3) Fetch PnL data
    //    Your util should now accept (address, token, amount, to)
    const pnlArray = await getWalletPnL(address, token, amount, to)

    if (!Array.isArray(pnlArray) || pnlArray.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No PnL data found for ${token}`
      })
    }
    if (pnlArray[0].error) {
      return res.status(500).json({
        success: false,
        error: pnlArray[0].error
      })
    }

    // 4) Massaging the response
    const result = {
      ...pnlArray[0],
      symbol: token,
      to,
      source: 'monorail'
    }

    return res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error(`❌ Error in /api/pnl for token=${req.body.token}:`, error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
})

export default router
