// utils/tokenReport.js
import TOKEN_LIST from '../constants/tokenList.js'

// ─── Dummy Prices ────────────────────────────────────────────────────────────
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

/**
 * Look up a dummy USD price for a token symbol.
 * @param {string} sym
 * @returns {number}
 */
function getDummyPrice(sym) {
  return DUMMY_PRICES[sym.toUpperCase()] || 0
}

/**
 * Generate a 7-day price history (with small random daily swings)
 * and compute percent change + sentiment.
 *
 * @param {string} symbol – token symbol, e.g. 'DAK'
 * @returns {Promise<{symbol:string, prices:{date:string,price:number}[], percentChange:number, sentiment:string}>}
 */
export async function getTokenReport(symbol) {
  const sym = symbol.toUpperCase()

  // 1) Validate token
  const tokenMeta = TOKEN_LIST.find(t => t.symbol.toUpperCase() === sym)
  if (!tokenMeta) throw new Error(`Token ${sym} not found.`)

  // 2) Base price from dummy map
  const basePrice = getDummyPrice(sym)
  if (basePrice === 0) throw new Error(`No dummy price for ${sym}`)

  // 3) Build 7-day history with ±3% random fluctuation
  const oneDayMs = 24 * 60 * 60 * 1000
  const now      = Date.now()
  const prices   = []
  const swingPct = 0.03 // max ±3% per day

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now - i * oneDayMs)
      .toISOString()
      .slice(0, 10)

    // random factor between 0.97 and 1.03
    const factor = 1 + (Math.random() * 2 * swingPct - swingPct)
    const price  = parseFloat((basePrice * factor).toFixed(6))

    prices.push({ date, price })
  }

  // 4) Compute percent change & sentiment
  const first = prices[0].price
  const last  = prices[prices.length - 1].price
  const change        = last - first
  const percentChange = first > 0 ? (change / first) * 100 : 0

  let sentiment = 'neutral'
  if (percentChange > 5)      sentiment = 'bullish'
  else if (percentChange < -5) sentiment = 'bearish'

  return {
    symbol:        sym,
    prices,
    percentChange: parseFloat(percentChange.toFixed(2)),
    sentiment
  }
}
