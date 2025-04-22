// api/best-price.js
import express from 'express'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { getQuote } from './quoteService.js'

const router = express.Router()
const USDC_ADDRESS = '0xf817257fed379853cDe0fa4F97AB987181B1e5Ea'

router.post('/', async (req, res) => {
  const { symbol } = req.body
  const token = TOKEN_LIST.find(t => t.symbol.toUpperCase() === symbol?.toUpperCase())

  if (!token) {
    return res.status(400).json({ success: false, error: 'Invalid token symbol.' })
  }

  try {
    const data = await getQuote({
      from: token.address,
      to: USDC_ADDRESS,
      amount: '1000000000000000000',
      sender: '0x0000000000000000000000000000000000000000'
    })

    const price = parseFloat(data?.quote?.output_formatted)
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
