// utils/tokenReport.js
import fetch from 'node-fetch'
import TOKEN_LIST from '../../src/constants/tokenList.js'

const ALCHEMY_URL = process.env.ALCHEMY_RPC_URL

async function fetch7DayPrices(tokenAddress) {
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'alchemy_getTokenMetadata',
    params: [tokenAddress]
  }

  const res = await fetch(ALCHEMY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await res.text()
    console.error(`❌ Alchemy token report error: Non-JSON response - ${text}`)
    throw new Error('Invalid response from Alchemy (non-JSON)')
  }

  const data = await res.json()
  const price = parseFloat(data?.result?.price?.usd || 0)
  if (!price) throw new Error('No price data available from Alchemy.')

  // Simulate 168 hourly price points over 7 days using the current price
  const now = Date.now()
  const hourlyInterval = 60 * 60 * 1000

  const sparkline = Array.from({ length: 168 }, (_, i) => ({
    timestamp: new Date(now - (167 - i) * hourlyInterval).toISOString(),
    price
  }))

  return sparkline
}

function analyzeSentiment(prices) {
  const change = prices[prices.length - 1].price - prices[0].price
  const percentChange = (change / prices[0].price) * 100

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
