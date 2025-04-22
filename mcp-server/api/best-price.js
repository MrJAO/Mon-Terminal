// api/best-price.js
import express from 'express'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { fetchMonorailPrice } from './fetchMonorailPrice.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const { symbol } = req.body
  const token = TOKEN_LIST.find(t => t.symbol.toUpperCase() === symbol?.toUpperCase())

  if (!token) {
    return res.status(400).json({ success: false, error: 'Invalid token symbol.' })
  }

  try {
    const price = await fetchMonorailPrice(token.symbol)
    if (!price || isNaN(price)) {
      return res.status(404).json({
        success: false,
        error: 'Invalid price data from Monorail'
      })
    }

    return res.json({
      success: true,
      price: price.toFixed(4),
      symbol: token.symbol,
      quotedIn: 'USDC',
      source: 'Monorail Pathfinder',
      note: 'Thanks Monorail API team for making this quote available 🧠✨'
    })
  } catch (err) {
    console.error('❌ Monorail quote error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
