// utils/tokenReport.js
import { ethers } from 'ethers'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { getQuote } from '../services/swapService.js'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const USDC_SYMBOL  = 'USDC'

export async function getTokenReport(symbol) {
  const tokenMeta = TOKEN_LIST.find(t => t.symbol.toUpperCase() === symbol.toUpperCase())
  if (!tokenMeta) throw new Error(`Token ${symbol} not found.`)

  const toToken = TOKEN_LIST.find(t => t.symbol === USDC_SYMBOL)
  if (!toToken) throw new Error(`Destination token ${USDC_SYMBOL} not found.`)

  let quoteData
  try {
    const rawAmt = ethers.parseUnits('1', tokenMeta.decimals || 18).toString()
    quoteData = await getQuote(tokenMeta.address, toToken.address, rawAmt, ZERO_ADDRESS)
  } catch (err) {
    throw new Error(`Monorail quote failed: ${err.message}`)
  }

  let outFmt = quoteData?.quote?.output_formatted ?? quoteData?.output_formatted
  if (typeof outFmt !== 'string') {
    // fallback to raw `output` formatted by USDC decimals
    const rawOut = quoteData?.quote?.output ?? quoteData?.output
    outFmt = typeof rawOut === 'string'
      ? ethers.formatUnits(rawOut, toToken.decimals || 6)
      : null
  }
  if (typeof outFmt !== 'string') throw new Error('Invalid quote response from Monorail')
  const price = parseFloat(outFmt)
  if (isNaN(price)) throw new Error('Invalid price data from Monorail')

  const oneDayMs = 24 * 60 * 60 * 1000, now = Date.now()
  const prices = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now - i * oneDayMs).toISOString().slice(0, 10)
    prices.push({ date, price: parseFloat(price.toFixed(6)) })
  }

  const first = prices[0].price, last = prices[prices.length - 1].price
  const change = last - first
  const percentChange = first > 0 ? (change / first) * 100 : 0
  let sentiment = 'neutral'
  if (percentChange > 5)      sentiment = 'bullish'
  else if (percentChange < -5) sentiment = 'bearish'

  return {
    symbol:        symbol.toUpperCase(),
    prices,
    percentChange: parseFloat(percentChange.toFixed(2)),
    sentiment
  }
}
