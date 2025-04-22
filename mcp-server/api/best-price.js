// api/best-price.js
import express from 'express'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { fetchMonorailPrice } from './fetchMonorailPrice.js'

const router = express.Router()

const FALLBACK_PRICES = {
  MON: 10, USDC: 1, USDT: 1, DAK: 2, YAKI: 0.013, CHOG: 0.164,
  WMON: 10, WETH: 1500, WBTC: 75000, WSOL: 130, BEAN: 2.103,
  shMON: 10, MAD: 0.098, sMON: 10, aprMON: 10, gMON: 10
}

router.post('/', async (req, res) => {
  const { symbol } = req.body
  const token = TOKEN_LIST.find(t => t.symbol.toUpperCase() === symbol?.toUpperCase())
  if (!token) {
    return res.status(400).json({ success: false, error: 'Invalid token symbol.' })
  }
  const fallback = FALLBACK_PRICES[token.symbol] || 0

  let price, note
  try {
    price = await fetchMonorailPrice(token.symbol)
    if (typeof price !== 'number' || isNaN(price)) {
      console.warn(`[BestPrice Fallback] ${symbol}: invalid price ${price}`)
      price = fallback
      note = 'Using fallback price due to invalid data'
    }
  } catch (err) {
    console.error(`❌ BestPrice error for ${symbol}:`, err)
    price = fallback
    note = 'Using fallback price due to error'
  }

  return res.json({
    success: true,
    price:     price.toFixed(4),
    symbol:    token.symbol,
    quotedIn:  'USDC',
    source:    'Monorail Pathfinder',
    ...(note ? { note } : {})
  })
})

export default router
