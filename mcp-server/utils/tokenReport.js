// utils/tokenReport.js
import fetch from 'node-fetch'
import TOKEN_LIST from '../../src/constants/tokenList.js'

async function fetch7DayPrices(tokenAddress) {
  const DUMMY_WALLET = process.env.ZERION_DUMMY_WALLET || '0xd9F016e453dE48D877e3f199E8FA4aADca2E979C'
  const url = new URL(`https://api.zerion.io/v1/wallets/${DUMMY_WALLET}/positions`)
  url.searchParams.set('filter[asset]', tokenAddress)

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${process.env.ZERION_API_KEY}`,
      'X-Env': 'test'
    }
  })

  const data = await res.json()
  const sparkline = data?.data?.[0]?.attributes?.price?.sparkline

  if (!Array.isArray(sparkline) || sparkline.length === 0) {
    throw new Error('No sparkline (price history) data available.')
  }

  // Convert sparkline points into timestamped points (assuming 7d = 168 hrs)
  const now = Date.now()
  const hourlyInterval = 60 * 60 * 1000
  return sparkline.map((price, i) => ({
    timestamp: new Date(now - (sparkline.length - 1 - i) * hourlyInterval).toISOString(),
    price
  }))
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
