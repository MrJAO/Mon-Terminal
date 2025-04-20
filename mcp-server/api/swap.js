// swap.js
import express from 'express'
import fetch from 'node-fetch'

console.log("✅ swap.js loaded") // ✅ Confirm this router is loaded

const router = express.Router()

const {
  MONORAIL_API_URL = 'https://testnet-pathfinder-v2.monorail.xyz',
  SLIPPAGE = '100',
  DEADLINE = '60'
} = process.env

const TOKEN_ADDRESSES = {
  MON: "native",
  USDC: "0xf817257fed379853cde0fa4f97ab987181b1e5ea",
  USDT: "0x88b8e2161dedc77ef4ab7585569d2415a1c1055d",
  DAK: "0x0f0bdebf0f83cd1ee3974779bcb7315f9808c714",
  YAKI: "0xfe140e1dce99be9f4f15d657cd9b7bf622270c50",
  CHOG: "0xe0590015a873bf326bd645c3e1266d4db41c4e6b",
  WMON: "0x760afe86e5de5fa0ee542fc7b7b713e1c5425701",
  WETH: "0xb5a30b0fdc5ea94a52fdc42e3e9760cb8449fb37",
  WBTC: "0xcf5a6076cfa32686c0df13abada2b40dec133f1d",
  WSOL: "0x5387c85a4965769f6b0df430638a1388493486f1",
  BEAN: "0x268e4e24e0051ec27b3d27a95977e71ce6875a05",
  shMON: "0x3a98250f98dd388c211206983453837c8365bdc1",
  MAD: "0xc8527e96c3cb9522f6e35e95c0a28feab8144f15",
  sMON: "0xe1d2439b75fb9746e7bc6bc777ae10aa7f7ef9c5",
  aprMON: "0xb2f82d0f38dc453d596ad40a37799446cc89274a",
  gMON: "0xaeef2f6b429cb59c9b2d7bb2141ada993e8571c3"
}

function resolveAddr(input) {
  const sym = input.toUpperCase()
  return TOKEN_ADDRESSES[sym] || input
}

// ✅ Test route
router.get('/test', (req, res) => {
  res.json({ status: '✅ Swap route is working' })
})

// POST /api/swap/confirm/last
router.post('/confirm/last', async (req, res) => {
  const { sender } = req.body
  if (!sender) {
    return res.status(400).json({ success: false, error: 'Missing sender address.' })
  }

  const quote = global._LAST_SWAP_QUOTE
  if (!quote || quote.sender !== sender) {
    return res.status(400).json({ success: false, error: 'No cached quote found for this wallet.' })
  }

  try {
    const url = new URL(`${MONORAIL_API_URL}/v1/transaction`)
    url.searchParams.set('from', quote.from)
    url.searchParams.set('to', quote.to)
    url.searchParams.set('amount', quote.amount)
    url.searchParams.set('sender', sender)
    url.searchParams.set('slippage', SLIPPAGE)
    url.searchParams.set('deadline', DEADLINE)

    const resp = await fetch(url.toString())
    const text = await resp.text()

    let json
    try {
      json = JSON.parse(text)
    } catch (err) {
      console.error('❌ Failed to parse Monorail JSON:', text)
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON returned from Monorail API.',
        raw: text,
      })
    }

    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: json?.error || 'Monorail API error.' })
    }

    if (!json.transaction || !json.transaction.rawTransaction) {
      return res.status(400).json({ success: false, error: 'Missing rawTransaction in response.' })
    }

    return res.json({ success: true, transaction: json.transaction })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/swap/confirm
router.post('/confirm', async (req, res) => {
  let { from, to, amount, sender } = req.body
  if (!from || !to || !amount || !sender) {
    return res.status(400).json({ success: false, error: 'Missing from, to, amount or sender.' })
  }

  from = resolveAddr(from)
  to = resolveAddr(to)

  try {
    const url = new URL(`${MONORAIL_API_URL}/v1/transaction`)
    url.searchParams.set('from', from)
    url.searchParams.set('to', to)
    url.searchParams.set('amount', amount)
    url.searchParams.set('sender', sender)
    url.searchParams.set('slippage', SLIPPAGE)
    url.searchParams.set('deadline', DEADLINE)

    const resp = await fetch(url.toString())
    const text = await resp.text()

    let json
    try {
      json = JSON.parse(text)
    } catch (err) {
      console.error('❌ Failed to parse Monorail JSON:', text)
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON returned from Monorail API.',
        raw: text,
      })
    }

    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: json?.error || 'Monorail API error.' })
    }

    if (!json.transaction || !json.transaction.rawTransaction) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction data from Monorail (missing rawTransaction).'
      })
    }

    return res.json({ success: true, transaction: json.transaction })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/swap/quote
router.post('/quote', async (req, res) => {
  let { from, to, amount, sender } = req.body
  if (!from || !to || !amount || !sender) {
    return res.status(400).json({ success: false, error: 'Missing from, to, amount or sender.' })
  }

  from = resolveAddr(from)
  to = resolveAddr(to)

  try {
    const url = new URL(`${MONORAIL_API_URL}/v1/quote`)
    url.searchParams.set('from', from)
    url.searchParams.set('to', to)
    url.searchParams.set('amount', amount)
    url.searchParams.set('sender', sender)
    url.searchParams.set('slippage', SLIPPAGE)
    url.searchParams.set('deadline', DEADLINE)

    const resp = await fetch(url.toString())
    const text = await resp.text()

    let quote
    try {
      quote = JSON.parse(text)
    } catch (err) {
      console.error('❌ Failed to parse Monorail quote:', text)
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON returned from Monorail quote endpoint.',
        raw: text,
      })
    }

    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: quote?.error || 'Monorail quote error.' })
    }

    global._LAST_SWAP_QUOTE = { from, to, amount, sender }

    return res.json({ success: true, quote })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
