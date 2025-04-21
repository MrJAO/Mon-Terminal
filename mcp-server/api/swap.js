// api/swap.js
import express from 'express'
import fetch from 'node-fetch'

console.log("✅ swap.js loaded")

const router = express.Router()

global._LAST_SWAP_QUOTE = global._LAST_SWAP_QUOTE || null

const {
  MONORAIL_API_URL = 'https://testnet-pathfinder-v2.monorail.xyz',
  SLIPPAGE = '50',      // default 0.5% (50 bps)
  DEADLINE = '60',      // 1 minute
  MAX_HOPS = '3'        // default max hops
} = process.env

const TOKEN_ADDRESSES = {
  MON:  'native',
  USDC: '0xf817257fed379853cde0fa4f97ab987181b1e5ea',
  USDT: '0x88b8e2161dedc77ef4ab7585569d2415a1c1055d',
  DAK:  '0x0f0bdebf0f83cd1ee3974779bcb7315f9808c714',
  YAKI: '0xfe140e1dce99be9f4f15d657cd9b7bf622270c50',
  CHOG: '0xe0590015a873bf326bd645c3e1266d4db41c4e6b',
  WMON: '0x760afe86e5de5fa0ee542fc7b7b713e1c5425701',
  WETH: '0xb5a30b0fdc5ea94a52fdc42e3e9760cb8449fb37',
  WBTC: '0xcf5a6076cfa32686c0df13abada2b40dec133f1d',
  WSOL: '0x5387c85a4965769f6b0df430638a1388493486f1',
  BEAN: '0x268e4e24e0051ec27b3d27a95977e71ce6875a05',
  shMON:'0x3a98250f98dd388c211206983453837c8365bdc1',
  MAD:  '0xc8527e96c3cb9522f6e35e95c0a28feab8144f15',
  sMON: '0xe1d2439b75fb9746e7bc6bc777ae10aa7f7ef9c5',
  aprMON:'0xb2f82d0f38dc453d596ad40a37799446cc89274a',
  gMON: '0xaeef2f6b429cb59c9b2d7bb2141ada993e8571c3',
}

function resolveAddr(input) {
  const sym = input.toUpperCase()
  return TOKEN_ADDRESSES[sym] || input
}

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Swap route is loaded' })
})

router.post('/quote', async (req, res) => {
  let { from, to, amount, sender } = req.body
  if (!from || !to || !amount || !sender) {
    return res.status(400).json({ success: false, error: 'Missing from, to, amount, or sender.' })
  }

  from = resolveAddr(from)
  to   = resolveAddr(to)

  try {
    const url = new URL(`${MONORAIL_API_URL}/v1/quote`)
    url.searchParams.set('from', from)
    url.searchParams.set('to', to)
    url.searchParams.set('amount', amount)
    url.searchParams.set('sender', sender)
    url.searchParams.set('slippage', SLIPPAGE)
    url.searchParams.set('deadline', DEADLINE)
    url.searchParams.set('max_hops', MAX_HOPS)

    console.log('🔍 Monorail quote URL:', url.toString())
    const resp = await fetch(url.toString())
    const json = await resp.json()

    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: json.error || 'Monorail quote error.' })
    }

    global._LAST_SWAP_QUOTE = { from, to, amount, sender }
    return res.json({ success: true, quote: json })
  } catch (err) {
    console.error('❌ Quote error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

// ✅ Build/confirm endpoint fixed and wrapped correctly
router.post('/confirm', async (req, res) => {
  const { from, to, amount, sender } = req.body || global._LAST_SWAP_QUOTE || {}

  if (!from || !to || !amount || !sender) {
    return res.status(400).json({ success: false, error: 'Missing from, to, amount, or sender.' })
  }

  try {
    const url = new URL(`${MONORAIL_API_URL}/v1/build`)
    url.searchParams.set('from', from)
    url.searchParams.set('to', to)
    url.searchParams.set('amount', amount)
    url.searchParams.set('sender', sender)
    url.searchParams.set('slippage', SLIPPAGE)
    url.searchParams.set('deadline', DEADLINE)
    url.searchParams.set('max_hops', MAX_HOPS)

    console.log('🚀 Monorail build URL:', url.toString())
    const resp = await fetch(url.toString())
    const text = (await resp.text()).trim()

    const contentType = resp.headers.get('content-type') || ''
    let txObj

    if (contentType.includes('application/json')) {
      txObj = JSON.parse(text)
      if (!resp.ok) {
        return res.status(resp.status).json({
          success: false,
          error: txObj?.error || 'Monorail API error.'
        })
      }
      if (!txObj.transaction?.rawTransaction) {
        return res.status(400).json({
          success: false,
          error: 'Missing rawTransaction in Monorail JSON response.'
        })
      }
      return res.json({ success: true, transaction: txObj.transaction })
    } else {
      if (!resp.ok) {
        return res.status(resp.status).json({
          success: false,
          error: `Monorail API error: ${text}`
        })
      }
      return res.json({
        success: true,
        transaction: { rawTransaction: text }
      })
    }
  } catch (err) {
    console.error('❌ Confirm error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
