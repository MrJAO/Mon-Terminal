import express from 'express'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import fetch from 'node-fetch'

const router = express.Router()

router.post('/', async (req, res) => {
  const { symbol } = req.body
  const token = TOKEN_LIST.find(t => t.symbol.toUpperCase() === symbol?.toUpperCase())

  if (!token) {
    return res.status(400).json({ success: false, error: 'Invalid token symbol.' })
  }

  try {
    const response = await fetch(`https://testnet-pathfinder-v2.monorail.xyz/v1/price?token=${token.address}`)
    const text = await response.text()
  
    let data
    try {
      data = JSON.parse(text)
    } catch (parseErr) {
      console.error('❌ Monorail response is not valid JSON:', text)
      return res.status(500).json({ success: false, error: 'Invalid response format from Monorail.' })
    }
  
    if (!data || !data.price) {
      return res.status(404).json({ success: false, error: 'Price data not found.' })
    }
  
    return res.json({
      success: true,
      price: parseFloat(data.price).toFixed(4),
      symbol: token.symbol,
      source: 'Monorail Pathfinder'
    })
  } catch (err) {
    console.error('❌ Best price fetch error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }  
})

export default router
