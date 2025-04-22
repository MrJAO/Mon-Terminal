// routes/swapBuilder.js
import express from 'express'
import { buildSwap } from '../api/swapService.js'
import { resolveTokenAddress } from '../api/resolveToken.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { from, to, amount, sender } = req.body
    console.log('⚙️ Incoming swap request:', { from, to, amount, sender })

    if (!from || !to || !amount || !sender) {
      console.warn('❌ Missing parameters in swap request.')
      return res.status(400).json({ success: false, error: 'Missing parameters' })
    }

    const fromAddr = await resolveTokenAddress(from)
    const toAddr = await resolveTokenAddress(to)

    console.log('🔍 Resolved fromAddr:', fromAddr)
    console.log('🔍 Resolved toAddr:', toAddr)

    if (!fromAddr || !toAddr) {
      console.warn('❌ Failed to resolve token addresses.')
      return res.status(400).json({ success: false, error: 'Failed to resolve token addresses' })
    }

    const rawTransaction = await buildSwap({ from: fromAddr, to: toAddr, amount, sender })
    console.log('✅ Built raw transaction:', rawTransaction)

    return res.json({ success: true, transaction: { rawTransaction } })
  } catch (err) {
    console.error('❌ SwapBuilder error:', err.message)
    console.error('❌ Full error stack:', err.stack)
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
