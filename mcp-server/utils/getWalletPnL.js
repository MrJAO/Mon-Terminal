// utils/getWalletPnL.js
import { ethers } from 'ethers'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { getQuote } from '../services/swapService.js'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Calculates PnL for a specific amount of token swapped to a destination token.
 */
export async function getWalletPnL(address, tokenSymbol, amountRequested = 1, toSymbol = 'USDC') {
  const token   = TOKEN_LIST.find(t => t.symbol.toUpperCase() === tokenSymbol.toUpperCase())
  const toToken = TOKEN_LIST.find(t => t.symbol.toUpperCase() === toSymbol.toUpperCase())
  if (!token)   return [{ symbol: tokenSymbol, error: 'Token not found in list.' }]
  if (!toToken) return [{ symbol: toSymbol,    error: 'Destination token not found.' }]

  try {
    const checksummed = ethers.getAddress(address)

    // 1) Get a Monorail quote for the desired amount (use 18 decimals universally)
    const rawUnits = ethers.parseUnits(amountRequested.toString(), 18).toString()
    console.log('> PnL quoting rawUnits:', rawUnits)
    let quoteData
    try {
      quoteData = await getQuote(token.address, toToken.address, rawUnits, ZERO_ADDRESS)
    } catch (err) {
      throw new Error(`Quote failed: ${err.message}`)
    }

    // 2) Normalize the output
    const rawQuote = quoteData.quote
    if (!rawQuote?.output_formatted) throw new Error('Invalid quote response from Monorail')
    const outAmt = parseFloat(rawQuote.output_formatted)

    // 3) Fetch average price using 1 unit quoted from Monorail
    const avgBuyPrice = await getPriceFromMonorail(token.address, toToken.address)

    // 4) Compute PnL
    const costForAmount = avgBuyPrice * amountRequested
    const pnlForAmount  = outAmt - costForAmount
    const pnlPct        = costForAmount > 0 ? (pnlForAmount / costForAmount) * 100 : 0

    return [{
      symbol:          token.symbol,
      amount:          amountRequested,
      to:              toToken.symbol,
      averageBuyPrice: parseFloat(avgBuyPrice.toFixed(6)),
      quotedAmount:    parseFloat(outAmt.toFixed(6)),
      costForAmount:   parseFloat(costForAmount.toFixed(6)),
      pnlForAmount:    parseFloat(pnlForAmount.toFixed(6)),
      pnlPercentage:   parseFloat(pnlPct.toFixed(2))
    }]

  } catch (err) {
    console.warn(`[PnL Error] ${tokenSymbol}: ${err.message}`)
    return [{ symbol: tokenSymbol, error: err.message }]
  }
}

// ─── Helper: Quote Price from Monorail ─────────────────────────────────────

const PRICE_CACHE = {}
async function getPriceFromMonorail(fromAddr, toAddr) {
  const key = `${fromAddr}-${toAddr}`
  if (PRICE_CACHE[key]) return PRICE_CACHE[key]
  try {
    const rawAmt = ethers.parseUnits('1', 18).toString()
    const q = await getQuote(fromAddr, toAddr, rawAmt, ZERO_ADDRESS)
    const price = parseFloat(q.quote.output_formatted) || 0
    PRICE_CACHE[key] = price
    return price
  } catch {
    return 0
  }
}
