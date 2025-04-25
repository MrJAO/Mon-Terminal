// utils/getWalletPnL.js
import { ethers } from 'ethers'
import TOKEN_LIST from '../constants/tokenList.js'

const DUMMY_PRICES = {
  MON:   10,
  USDC:  1,
  USDT:  1,
  DAK:   2.5,
  YAKI:  0.0132,
  CHOG:  0.1548,
  WMON:  10,
  WETH:  1755.99,
  WBTC:  86550.41,
  WSOL:  150.58,
  BEAN:  2.3031,
  shMON: 10,
  MAD:   0.0967,
  sMON:  10,
  aprMON:10,
  gMON:  10,
}

/**
 * @param {string} symbol
 * @returns {number} price in USD-equivalent (via DUMMY_PRICES), or 0 if unknown
 */
function getDummyPrice(symbol) {
  return DUMMY_PRICES[symbol.toUpperCase()] || 0
}

/**
 * @param {number} pct - max swing percentage (e.g. 0.05 for ±5%)
 * @returns {number} random factor between 1 - pct and 1 + pct
 */
function randomFactor(pct) {
  return 1 + (Math.random() * 2 * pct - pct)
}

/**
 * Calculates a 3-day PnL history for swapping `amountRequested` of `tokenSymbol` into `toSymbol`
 * using simulated dummy prices with small daily swings.
 *
 * @param {string} address         — user wallet address (will be checksummed)
 * @param {string} tokenSymbol     — e.g. 'MON', 'DAK'
 * @param {number} amountRequested — how many tokens to swap
 * @param {string} toSymbol        — destination token, default 'USDC'
 * @returns {Promise<Array<{ date: string, symbol: string, amount: number, to: string, averageBuyPrice: number, quotedAmount: number, costForAmount: number, pnlForAmount: number, pnlPercentage: number }>>}
 */
export async function getWalletPnL(
  address,
  tokenSymbol,
  amountRequested = 1,
  toSymbol = 'USDC'
) {
  const token   = TOKEN_LIST.find(t => t.symbol.toUpperCase() === tokenSymbol.toUpperCase())
  const toToken = TOKEN_LIST.find(t => t.symbol.toUpperCase() === toSymbol.toUpperCase())

  if (!token)   return [{ symbol: tokenSymbol, error: 'Token not found in list.' }]
  if (!toToken) return [{ symbol: toSymbol,    error: 'Destination token not found.' }]

  try {
    // validate address
    ethers.getAddress(address)

    // base dummy prices
    const basePriceFrom = getDummyPrice(token.symbol)
    const basePriceTo   = getDummyPrice(toToken.symbol)
    if (basePriceFrom === 0) throw new Error(`No dummy price for ${token.symbol}`)
    if (basePriceTo   === 0) throw new Error(`No dummy price for ${toToken.symbol}`)

    const days = 3
    const oneDayMs = 24 * 60 * 60 * 1000
    const now = Date.now()
    const results = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * oneDayMs).toISOString().slice(0, 10)

      // simulate daily swing ±5%
      const priceFromSim = basePriceFrom * randomFactor(0.05)
      const priceToSim   = basePriceTo   * randomFactor(0.05)

      const avgBuyPrice  = priceFromSim / priceToSim
      const quotedAmount = avgBuyPrice * amountRequested
      const costForAmount = priceFromSim * amountRequested
      const pnlForAmount  = quotedAmount - costForAmount
      const pnlPct        = costForAmount > 0
        ? (pnlForAmount / costForAmount) * 100
        : 0

      results.push({
        date,
        symbol:          token.symbol,
        amount:          amountRequested,
        to:              toToken.symbol,
        averageBuyPrice: parseFloat(avgBuyPrice.toFixed(6)),
        quotedAmount:    parseFloat(quotedAmount.toFixed(6)),
        costForAmount:   parseFloat(costForAmount.toFixed(6)),
        pnlForAmount:    parseFloat(pnlForAmount.toFixed(6)),
        pnlPercentage:   parseFloat(pnlPct.toFixed(2)),
      })
    }

    return results

  } catch (err) {
    console.warn(`[PnL Error] ${tokenSymbol}: ${err.message}`)
    return [{ symbol: tokenSymbol, error: err.message }]
  }
}
