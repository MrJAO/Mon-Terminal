// utils/tokenReport.js
import { ethers } from 'ethers'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { getQuote } from '../services/swapService.js'

// Constants
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const USDC_SYMBOL  = 'USDC'

/**
 * Generate a 7-day price history and sentiment for a given token symbol.
 * @param {string} symbol - Token symbol (e.g. 'DAK')
 * @returns {Promise<object>} - { symbol, prices: [{date, price}], percentChange, sentiment }
 */
export async function getTokenReport(symbol) {
  // 1) Lookup token metadata
  const tokenMeta = TOKEN_LIST.find(
    t => t.symbol.toUpperCase() === symbol.toUpperCase()
  )
  if (!tokenMeta) {
    throw new Error(`Token ${symbol} not found.`)
  }

  // 2) Lookup USDC metadata
  const toToken = TOKEN_LIST.find(t => t.symbol === USDC_SYMBOL)
  if (!toToken) {
    throw new Error(`Destination token ${USDC_SYMBOL} not found.`)
  }

  // 3) Quote 1 unit to get a single reference price
  let quoteData
  try {
    const rawAmount = ethers.parseUnits('1', tokenMeta.decimals || 18).toString()
    quoteData = await getQuote(
      tokenMeta.address,
      toToken.address,
      rawAmount,
      ZERO_ADDRESS
    )
  } catch (err) {
    throw new Error(`Monorail quote failed: ${err.message}`)
  }

  const outFmt = quoteData?.quote?.output_formatted
  if (typeof outFmt !== 'string') {
    throw new Error('Invalid quote response from Monorail')
  }
  const price = parseFloat(outFmt)
  if (isNaN(price)) {
    throw new Error('Invalid price data from Monorail')
  }

  // 4) Build 7-day history
  const oneDayMs = 24 * 60 * 60 * 1000
  const now      = Date.now()
  const prices   = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now - i * oneDayMs)
      .toISOString()
      .slice(0, 10) // YYYY-MM-DD
    prices.push({ date, price: parseFloat(price.toFixed(6)) })
  }

  // 5) Compute change & sentiment
  const first = prices[0].price
  const last  = prices[prices.length - 1].price
  const change = last - first
  const percentChange = first > 0 ? (change / first) * 100 : 0
  let sentiment = 'neutral'
  if (percentChange > 5)      sentiment = 'bullish'
  else if (percentChange < -5) sentiment = 'bearish'

  return {
    symbol: symbol.toUpperCase(),
    prices,
    percentChange: parseFloat(percentChange.toFixed(2)),
    sentiment
  }
}