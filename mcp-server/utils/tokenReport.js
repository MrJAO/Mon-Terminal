// utils/tokenReport.js
import fetch from 'node-fetch'
import TOKEN_LIST from '../../src/constants/tokenList.js'

const MONORAIL_HISTORICAL_URL = 'https://testnet-pathfinder-v2.monorail.xyz/v1/historical'

async function fetch7DayPrices(tokenAddress) {
    const url = new URL(MONORAIL_HISTORICAL_URL)
    url.searchParams.set('token', tokenAddress)
    url.searchParams.set('range', '7d')
  
    const response = await fetch(url.toString())
    const text = await response.text()
  
    let data
    try {
      data = JSON.parse(text)
    } catch (parseErr) {
      console.error('❌ Monorail response is not valid JSON:', text)
      throw new Error('Invalid response format from Monorail.')
    }
  
    if (!Array.isArray(data?.prices) || data.prices.length === 0) {
      throw new Error('No price history data returned.')
    }
  
    return data.prices.map((entry) => ({
      timestamp: entry.timestamp,
      price: parseFloat(entry.price),
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
