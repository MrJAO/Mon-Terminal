// utils/tokenReport.js
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { getQuote } from '../api/quoteService.js'

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

const USDC_ADDRESS = '0xf817257fed379853cDe0fa4F97AB987181B1e5Ea'

async function getPriceFromMonorail(tokenAddress) {
  try {
    const data = await getQuote({
      from: tokenAddress,
      to: USDC_ADDRESS,
      amount: '1000000000000000000',
      sender: '0x0000000000000000000000000000000000000000'
    })

    const price = parseFloat(data.quote.output_formatted)
    if (!isNaN(price)) return price

    throw new Error('Invalid quote format')
  } catch (err) {
    console.warn(`[Monorail Price Error] ${tokenAddress}:`, err.message)
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
  const price = await getPriceFromMonorail(tokenAddress)
  const now = Date.now()
  const hourlyInterval = 60 * 60 * 1000

  return Array.from({ length: 168 }, (_, i) => ({
    timestamp: new Date(now - (167 - i) * hourlyInterval).toISOString(),
    price
  }))
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
