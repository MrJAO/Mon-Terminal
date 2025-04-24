// api/best-price.js
import express from 'express'
import TOKEN_LIST from '../../src/constants/tokenList.js'

const router = express.Router()
const ZERO = '0x0000000000000000000000000000000000000000'

// ─── Dummy USD prices per token ──────────────────────────────────────────────
const DUMMY_PRICES = {
  MON:    10,
  USDC:   1,
  USDT:   1,
  DAK:    2.5,
  YAKI:   0.0132,
  CHOG:   0.1548,
  WMON:   10,
  WETH:   1755.99,
  WBTC:   86550.41,
  WSOL:   150.58,
  BEAN:   2.3031,
  shMON:  10,
  MAD:    0.0967,
  sMON:   10,
  aprMON: 10,
  gMON:   10,
}

// ─── Available DEXs ───────────────────────────────────────────────────────────
const DEXS = [
  'Monorail',
  'Ambient Finance',
  'Crystal Exchange',
  'iZumi Finance',
  'zkSwap',
]

/**
 * POST /api/best-price
 * { symbol, to, sender? }
 */
router.post('/', async (req, res) => {
  try {
    // 1) Normalize inputs
    const symbol   = (req.body.symbol || '').trim().toUpperCase()
    const toSymbol = (req.body.to     || 'USDC').trim().toUpperCase()
    const sender   = (req.body.sender || ZERO).trim()

    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Missing token symbol.' })
    }

    // 2) Lookup tokens
    const token   = TOKEN_LIST.find(t => t.symbol.toUpperCase() === symbol)
    const toToken = TOKEN_LIST.find(t => t.symbol.toUpperCase() === toSymbol)

    if (!token) {
      return res.status(400).json({ success: false, error: 'Invalid token symbol.' })
    }
    if (!toToken) {
      return res.status(400).json({ success: false, error: 'Invalid destination symbol.' })
    }

    // 3) Get base dummy price in USD
    const basePriceFrom = DUMMY_PRICES[symbol]
    const basePriceTo   = DUMMY_PRICES[toSymbol]
    if (basePriceFrom == null) {
      throw new Error(`No dummy price for ${symbol}`)
    }
    if (basePriceTo == null) {
      throw new Error(`No dummy price for ${toSymbol}`)
    }

    // 4) Simulate quotes on each DEX with ±5% random swing
    //    (not strictly needed if we're only picking one, but left here for clarity)
    const simulated = DEXS.map(dex => {
      const swing = (Math.random() * 2 - 1) * 0.05  // ±5%
      const price = parseFloat(((basePriceFrom / basePriceTo) * (1 + swing)).toFixed(6))
      return { dex, price }
    })

    // 5) Pick one DEX at random to “be the best”
    const choice = simulated[Math.floor(Math.random() * simulated.length)]

    // 6) Respond
    return res.json({
      success: true,
      data: {
        symbol:        token.symbol,
        to:            toToken.symbol,
        pricePerUnit:  choice.price,
        dex:           choice.dex,
      }
    })

  } catch (err) {
    console.error('❌ /api/best-price error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
