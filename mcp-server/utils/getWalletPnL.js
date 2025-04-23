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
    const inDecimals  = token.decimals   || 18
    const outDecimals = toToken.decimals || 18

    // 1) Average buy price over recent ERC-20 transfers
    let totalCost = 0, totalAmt = 0
    if (token.address !== 'native') {
      const transfers = await getRecentTokenTransfers(checksummed, token.address)
      for (const tx of transfers) {
        const amt   = parseFloat(ethers.formatUnits(tx.rawContract.value, inDecimals))
        const price = await getPriceFromMonorail(token.address, toToken.address)
        if (!price) continue
        totalAmt  += amt
        totalCost += amt * price
      }
    }
    const avgBuyPrice = totalAmt > 0 ? totalCost / totalAmt : 0

    // 2) Get a Monorail quote for the desired amount
    const rawUnits = ethers.parseUnits(amountRequested.toString(), inDecimals).toString()
    console.log('> PnL quoting rawUnits:', rawUnits)
    let quoteData
    try {
      quoteData = await getQuote(token.address, toToken.address, rawUnits, ZERO_ADDRESS)
    } catch (err) {
      throw new Error(`Quote failed: ${err.message}`)
    }

    // 3) Normalize the output
    const rawQuote = quoteData.quote
    if (!rawQuote?.output_formatted) throw new Error('Invalid quote response from Monorail')
    const outAmt = parseFloat(rawQuote.output_formatted)

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

// ─── Helpers ────────────────────────────────────────────────────────────

async function getRecentTokenTransfers(address, contract) {
  try {
    const body = {
      jsonrpc: '2.0', id: 1, method: 'alchemy_getAssetTransfers',
      params: [{
        fromBlock: '0x0',
        toAddress: address,
        contractAddresses: [contract],
        category: ['erc20'],
        withMetadata: true
      }]
    }
    const res  = await fetch(process.env.ALCHEMY_TESTNET_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const js   = await res.json()
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000
    return (js.result?.transfers || []).filter(tx =>
      new Date(tx.metadata.blockTimestamp).getTime() > cutoff
    )
  } catch {
    return []
  }
}

const PRICE_CACHE = {}
async function getPriceFromMonorail(fromAddr, toAddr) {
  const key = `${fromAddr}-${toAddr}`
  if (PRICE_CACHE[key]) return PRICE_CACHE[key]
  try {
    // Look up 'from' token decimals
    const fromMeta = TOKEN_LIST.find(t => t.address.toLowerCase() === fromAddr.toLowerCase())
    const fromDecimals = fromMeta?.decimals ?? 18
    // Quote exactly 1 unit of from-token
    const rawAmt = ethers.parseUnits('1', fromDecimals).toString()
    const q = await getQuote(fromAddr, toAddr, rawAmt, ZERO_ADDRESS)
    const price = parseFloat(q.quote.output_formatted) || 0
    PRICE_CACHE[key] = price
    return price
  } catch {
    return 0
  }
}