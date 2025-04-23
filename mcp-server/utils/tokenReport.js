// utils/tokenReport.js
import { ethers } from 'ethers'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { getQuote } from '../services/swapService.js'

// Constants
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const USDC_SYMBOL  = 'USDC'

/**
 * Generate a 7-day price history for a given token symbol using Monorail quotes.
 * Each day uses the same quoted price for simplicity.
 * @param {string} symbol - Token symbol (e.g. 'DAK')
 * @returns {Promise<Array<{ date: string, price: number }>>}
 */
export async function getTokenReport(symbol) {
  // 1) Lookup token metadata
  const tokenMeta = TOKEN_LIST.find(
    t => t.symbol.toUpperCase() === symbol.toUpperCase()
  )
  if (!tokenMeta) {
    throw new Error(`Token ${symbol} not found.`)
  }

  // 2) Prepare for quote of 1 token
  const rawAmount = ethers.parseUnits('1', 18).toString()
  const toToken   = TOKEN_LIST.find(t => t.symbol === USDC_SYMBOL)
  if (!toToken) {
    throw new Error(`Destination token ${USDC_SYMBOL} not found.`)
  }

  // 3) Fetch current price via Monorail once
  const quoteData = await getQuote(
    tokenMeta.address,
    toToken.address,
    rawAmount,
    ZERO_ADDRESS
  )
  const price = parseFloat(quoteData.quote.output_formatted)
  if (isNaN(price)) {
    throw new Error('Invalid price data from Monorail')
  }

  // 4) Build 7-day history (daily entries)
  const oneDayMs = 24 * 60 * 60 * 1000
  const now      = Date.now()
  const history  = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now - i * oneDayMs)
      .toISOString()
      .slice(0, 10) // YYYY-MM-DD
    history.push({ date, price: parseFloat(price.toFixed(6)) })
  }

  return history
}
