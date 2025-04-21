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
    const ALCHEMY_URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`

    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getTokenMetadata',
      params: [token.address]
    }

    const response = await fetch(ALCHEMY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ Invalid response from Alchemy:', text)
      return res.status(500).json({ success: false, error: 'Alchemy did not return JSON.' })
    }

    const data = await response.json()
    const price = parseFloat(data?.result?.price || 0)

    if (!price) {
      return res.status(404).json({ success: false, error: 'Price not available for this token.' })
    }

    return res.json({
      success: true,
      price: price.toFixed(4),
      symbol: token.symbol,
      quotedIn: 'USD',
      source: 'Alchemy Token Metadata'
    })
  } catch (err) {
    console.error('❌ Alchemy best-price fetch error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
