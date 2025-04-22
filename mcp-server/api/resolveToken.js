// api/resolveToken.js
import fetch from 'node-fetch'

const {
  MONORAIL_DATA_API = 'https://testnet-api.monorail.xyz'
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
  gMON: '0xaeef2f6b429cb59c9b2d7bb2141ada993e8571c3'
}

export async function resolveTokenAddress(symbol) {
  if (!symbol) return null

  console.log(`🔍 Resolving token: ${symbol}`)

  if (symbol.toLowerCase() === 'mon') {
    console.log(`✅ Resolved ${symbol} as native MON`)
    return '0x0000000000000000000000000000000000000000'
  }

  try {
    const verified = await fetch(`${MONORAIL_DATA_API}/v1/tokens/category/verified`)
    const list = await verified.json()
    const match = list.find(t => t.symbol.toLowerCase() === symbol.toLowerCase())
    if (match) {
      console.log(`✅ Found verified token: ${symbol} → ${match.address}`)
      return match.address
    }

    const search = await fetch(`${MONORAIL_DATA_API}/v1/tokens?find=${symbol}`)
    const results = await search.json()
    const exact = results.find(t => t.symbol.toLowerCase() === symbol.toLowerCase())
    const resolved = exact?.address || results[0]?.address || null

    if (resolved) {
      console.log(`✅ Found via token search: ${symbol} → ${resolved}`)
    } else {
      console.warn(`⚠️ Token ${symbol} not found via search.`)
    }

    return resolved
  } catch (err) {
    console.warn(`❌ API error while resolving ${symbol}: ${err.message}`)
    const fallback = TOKEN_ADDRESSES[symbol.toUpperCase()] || null
    if (fallback) {
      console.log(`🔁 Using fallback hardcoded address for ${symbol}: ${fallback}`)
    } else {
      console.warn(`⚠️ No fallback found for ${symbol}`)
    }
    return fallback
  }
}
