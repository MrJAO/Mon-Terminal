// utils/tokenReport.js
import { Alchemy, Network } from 'alchemy-sdk'
import TOKEN_LIST from '../../src/constants/tokenList.js'

// — Mainnet SDK client for USD prices —
const alchemyPrice = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET
})

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

/**
 * Fetches a single USD price via Alchemy Mainnet SDK,
 * falling back to your hardcoded map if necessary.
 */
async function getPriceFromAlchemy(tokenAddress) {
  try {
    const metadata = await alchemyPrice.core.getTokenMetadata(tokenAddress)
    const price = metadata?.price?.usd
    if (price && !isNaN(price)) return price
    throw new Error('no USD price in metadata')
  } catch (err) {
    console.warn(`[Alchemy Price Error] ${tokenAddress}:`, err.message)
    const token = TOKEN_LIST.find(
      t => t.address.toLowerCase() === tokenAddress.toLowerCase()
    )
    const sym = token?.symbol?.toUpperCase()
    return sym && FALLBACK_PRICES[sym] != null
      ? FALLBACK_PRICES[sym]
      : (() => { throw new Error('No price data available') })()
  }
}

async function fetch7DayPrices(tokenAddress) {
  // Get a single “current” price (Mainnet or fallback)
  const price = await getPriceFromAlchemy(tokenAddress)
  
  // Simulate 168 hourly points over the past 7 days
  const now = Date.now()
  const hourlyInterval = 60 * 60 * 1000

  return Array.from({ length: 168 }, (_, i) => ({
    timestamp: new Date(now - (167 - i) * hourlyInterval).toISOString(),
    price
  }))
}

function analyzeSentiment(prices) {
  const first = prices[0].price
  const last  = prices[prices.length - 1].price
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
    const prices = await fetch7DayPrices(token.address)
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
