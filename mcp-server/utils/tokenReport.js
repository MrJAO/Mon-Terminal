// utils/tokenReport.js
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { fetchMonorailPrice } from './api/fetchMonorailPrice.js'

const FALLBACK_PRICES = {
  MON: 10,
  USDC: 1,
  USDT: 1,
  DAK: 2,
  YAKI: 0.013,
  CHOG: 0.164,
  WMON: 10,
  WETH: 1500,
  WBTC: 75000,
  WSOL: 130,
  BEAN: 2.103,
  shMON: 10,
  MAD: 0.098,
  sMON: 10,
  aprMON: 10,
  gMON: 10
}

async function fetch7DayPrices(symbol) {
  try {
    const price = await fetchMonorailPrice(symbol)
    const now = Date.now()
    const hourlyInterval = 60 * 60 * 1000

    return Array.from({ length: 168 }, (_, i) => ({
      timestamp: new Date(now - (167 - i) * hourlyInterval).toISOString(),
      price
    }))
  } catch (err) {
    console.warn(`[TokenReport Fallback] ${symbol}:`, err.message)
    const fallback = FALLBACK_PRICES[symbol.toUpperCase()] || 0
    const now = Date.now()
    const hourlyInterval = 60 * 60 * 1000

    return Array.from({ length: 168 }, (_, i) => ({
      timestamp: new Date(now - (167 - i) * hourlyInterval).toISOString(),
      price: fallback
    }))
  }
}

function analyzeSentiment(prices) {
  const first = prices[0].price
  const last = prices[prices.length - 1].price
  const change = last - first
  const percentChange = (change / first) * 100

  let sentiment = 'neutral'
  if (percentChange > 5) sentiment = 'bullish'
  else if (percentChange < -5) sentiment = 'bearish'

  return { percentChange: percentChange.toFixed(2), sentiment }
}

export async function getTokenReport(symbol) {
  const token = TOKEN_LIST.find(t => t.symbol.toUpperCase() === symbol.toUpperCase())
  if (!token) return { error: `Token ${symbol} not found.` }

  try {
    const prices = await fetch7DayPrices(symbol)
    const { percentChange, sentiment } = analyzeSentiment(prices)

    return {
      symbol: token.symbol,
      prices,
      percentChange,
      sentiment
    }
  } catch (err) {
    return { error: err.message }
  }
}
