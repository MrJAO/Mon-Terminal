// utils/getWalletPnL.js
import { ethers } from 'ethers'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { getQuote } from '../services/swapService.js'

const DECIMALS_CACHE = {
  MON:   18, USDC:  6, USDT:  6, DAK:  18, YAKI: 18,
  CHOG:  18, WMON: 18, WETH: 18, WBTC:  8, WSOL: 9,
  BEAN:  18, shMON:18, MAD:   18, sMON:  18, aprMON:18, gMON: 18
}
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
    const inDecimals  = DECIMALS_CACHE[token.symbol]   || token.decimals || 18
    const outDecimals = DECIMALS_CACHE[toToken.symbol]|| toToken.decimals || 18

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
    let quoteData
    try {
      quoteData = await getQuote(token.address, toToken.address, rawUnits, ZERO_ADDRESS)
    } catch (err) {
      throw new Error(`Quote failed: ${err.message}`)
    }

    // 3) Normalize the output: try `output_formatted`, else fall back to raw `output`
    let formatted = quoteData?.quote?.output_formatted
    if (typeof formatted !== 'string') {
      const rawOut = quoteData?.quote?.output ?? quoteData?.output
      if (typeof rawOut === 'string') {
        formatted = ethers.formatUnits(rawOut, outDecimals)
      }
    }
    if (typeof formatted !== 'string') {
      throw new Error('Invalid quote response from Monorail')
    }
    const outAmt = parseFloat(formatted)

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
    const q = await getQuote(
      fromAddr,
      toAddr,
      ethers.parseUnits('1', DECIMALS_CACHE['USDC'] || 6).toString(),
      ZERO_ADDRESS
    )
    let s = q?.quote?.output_formatted ?? q?.output_formatted
    if (typeof s !== 'string') s = ethers.formatUnits(q?.quote?.output ?? q?.output, DECIMALS_CACHE['USDC'] || 6)
    const price = parseFloat(s) || 0
    PRICE_CACHE[key] = price
    return price
  } catch {
    return 0
  }
}
