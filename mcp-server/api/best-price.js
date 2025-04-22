// api/best-price.js
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
    const quoteRes = await fetch('https://testnet-pathfinder-v2.monorail.xyz/v1/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: token.address,
        to: '0xf817257fed379853cDe0fa4F97AB987181B1e5Ea', // USDC address
        amount: '1000000000000000000',
        sender: '0x0000000000000000000000000000000000000000'
      })
    })

    const data = await quoteRes.json()

    if (!data.success || !data.quote?.output_formatted) {
      return res.status(404).json({
        success: false,
        error: data.error || 'Quote not available from Monorail'
      })
    }

    return res.json({
      success: true,
      price: parseFloat(data.quote.output_formatted).toFixed(4),
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
