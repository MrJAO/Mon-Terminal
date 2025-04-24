// utils/getWalletPnL.js
import { ethers } from 'ethers'
import TOKEN_LIST from '../../src/constants/tokenList.js'

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
 * Calculates PnL for swapping `amountRequested` of `tokenSymbol` into `toSymbol`
 * using static dummy prices.
 *
 * @param {string} address         — user wallet address (will be checksummed)
 * @param {string} tokenSymbol     — e.g. 'MON', 'DAK'
 * @param {number} amountRequested — how many tokens to swap
 * @param {string} toSymbol        — destination token, default 'USDC'
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

    // lookup dummy prices
    const priceFrom = getDummyPrice(token.symbol)
    const priceTo   = getDummyPrice(toToken.symbol)
    if (priceFrom === 0) throw new Error(`No dummy price for ${token.symbol}`)
    if (priceTo   === 0) throw new Error(`No dummy price for ${toToken.symbol}`)

    // price of 1 unit of token in terms of toSymbol
    const averageBuyPrice = priceFrom / priceTo

    // how much toSymbol you'll receive for amountRequested
    const quotedAmount = averageBuyPrice * amountRequested

    // cost in USD (priceFrom × amount)
    const costForAmount = priceFrom * amountRequested

    // PnL = what you get back minus what you paid
    const pnlForAmount  = quotedAmount - costForAmount
    const pnlPct        = costForAmount > 0
      ? (pnlForAmount / costForAmount) * 100
      : 0

    return [{
      symbol:          token.symbol,
      amount:          amountRequested,
      to:              toToken.symbol,
      averageBuyPrice: parseFloat(averageBuyPrice.toFixed(6)),
      quotedAmount:    parseFloat(quotedAmount.toFixed(6)),
      costForAmount:   parseFloat(costForAmount.toFixed(6)),
      pnlForAmount:    parseFloat(pnlForAmount.toFixed(6)),
      pnlPercentage:   parseFloat(pnlPct.toFixed(2)),
    }]

  } catch (err) {
    console.warn(`[PnL Error] ${tokenSymbol}: ${err.message}`)
    return [{ symbol: tokenSymbol, error: err.message }]
  }
}
