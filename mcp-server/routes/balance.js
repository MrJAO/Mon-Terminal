import express from 'express'
import { getTokenBalance } from '../utils/getTokenBalance.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const { address, token } = req.body
  if (!address || !token) return res.status(400).json({ message: 'Missing address or token' })

  try {
    const result = await getTokenBalance(address, token)
    res.json({ success: true, balance: result })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
