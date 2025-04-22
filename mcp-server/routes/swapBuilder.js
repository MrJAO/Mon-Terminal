// routes/swapBuilder.js
import express from 'express'
import { buildSwap } from '../api/swapService.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { from, to, amount, sender } = req.body
    if (!from || !to || !amount || !sender) {
      return res.status(400).json({ success: false, error: 'Missing parameters' })
    }

    const rawTransaction = await buildSwap({ from, to, amount, sender })
    return res.json({ success: true, transaction: { rawTransaction } })
  } catch (err) {
    console.error('❌ SwapBuilder error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
