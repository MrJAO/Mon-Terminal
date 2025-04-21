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

  // Default quote to USDC
  const USDC = TOKEN_LIST.find(t => t.symbol === 'USDC')

  try {
    const url = new URL('https://api.zerion.io/v1/swap/quotes')
    url.searchParams.set('from_asset', token.address)
    url.searchParams.set('to_asset', USDC.address) // Change to something else if needed
    url.searchParams.set('from_amount', '1') // simulate best price for 1 token

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.ZERION_API_KEY}`,
        'X-Env': 'test'
      }
    })

    const data = await response.json()

    if (!data || !Array.isArray(data.data) || data.data.length === 0) {
      return res.status(404).json({ success: false, error: 'No quotes found.' })
    }

    const bestQuote = data.data[0]
    const price = bestQuote.attributes?.price?.value

    return res.json({
      success: true,
      price: parseFloat(price).toFixed(4),
      symbol: token.symbol,
      quotedIn: 'USDC',
      source: 'Zerion Swap Quotes'
    })
  } catch (err) {
    console.error('❌ Zerion best-price fetch error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
