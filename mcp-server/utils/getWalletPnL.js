// utils/getWalletPnL.js
import { ethers } from 'ethers'
import { provider } from './provider.js'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { getQuote } from '../services/swapService.js'

const DECIMALS_CACHE = {
  MON: 18, USDC: 6, USDT: 6, DAK: 18, YAKI: 18, CHOG: 18, WMON: 18,
  WETH: 18, WBTC: 8, WSOL: 9, BEAN: 18, shMON: 18, MAD: 18,
  sMON: 18, aprMON: 18, gMON: 18
}
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export async function getWalletPnL(address, tokenSymbol, amountRequested = 1, toSymbol = 'USDC') {
  const token   = TOKEN_LIST.find(t => t.symbol.toUpperCase() === tokenSymbol.toUpperCase())
  const toToken = TOKEN_LIST.find(t => t.symbol.toUpperCase() === toSymbol.toUpperCase())
  if (!token)   return [{ symbol: tokenSymbol, error: 'Token not found in list.' }]
  if (!toToken) return [{ symbol: toSymbol,    error: 'Destination token not found.' }]

  try {
    const checksummedAddress = ethers.getAddress(address)
    const decimalsIn  = DECIMALS_CACHE[token.symbol]   || token.decimals || 18
    const decimalsOut = DECIMALS_CACHE[toToken.symbol] || toToken.decimals || 18

    // 1) average buy price...
    let totalCost = 0, totalAmount = 0
    if (token.address !== 'native') {
      const transfers = await getRecentTokenTransfers(checksummedAddress, token.address)
      for (const tx of transfers) {
        const amt = parseFloat(ethers.formatUnits(tx.rawContract.value, decimalsIn))
        const price = await getPriceFromMonorail(token.address, toToken.address)
        if (!price) continue
        totalAmount += amt
        totalCost   += amt * price
      }
    }
    const averageBuyPrice = totalAmount > 0 ? totalCost / totalAmount : 0

    // 2) quote desired amount
    const amountUnits = ethers.parseUnits(amountRequested.toString(), decimalsIn).toString()
    let quoteData
    try {
      quoteData = await getQuote(token.address, toToken.address, amountUnits, ZERO_ADDRESS)
    } catch (err) {
      throw new Error(`Quote failed: ${err.message}`)
    }

    // 3) extract output, falling back to raw `output`
    let formatted = quoteData?.quote?.output_formatted
    if (typeof formatted !== 'string') {
      // if missing, look at `output` and format by decimalsOut
      const rawOut = quoteData?.quote?.output ?? quoteData?.output
      formatted = typeof rawOut === 'string'
        ? ethers.formatUnits(rawOut, decimalsOut)
        : null
    }
    if (typeof formatted !== 'string') {
      throw new Error('Invalid quote response from Monorail')
    }
    const outAmount = parseFloat(formatted)

    // 4) compute PnL
    const costForAmount = averageBuyPrice * amountRequested
    const pnlForAmount  = outAmount - costForAmount
    const pnlPercentage = costForAmount > 0 ? (pnlForAmount / costForAmount) * 100 : 0

    return [{
      symbol:          token.symbol,
      amount:          amountRequested,
      to:              toToken.symbol,
      averageBuyPrice: parseFloat(averageBuyPrice.toFixed(6)),
      quotedAmount:    parseFloat(outAmount.toFixed(6)),
      costForAmount:   parseFloat(costForAmount.toFixed(6)),
      pnlForAmount:    parseFloat(pnlForAmount.toFixed(6)),
      pnlPercentage:   parseFloat(pnlPercentage.toFixed(2))
    }]
  } catch (err) {
    console.warn(`[PnL Error] ${tokenSymbol}: ${err.message}`)
    return [{ symbol: tokenSymbol, error: err.message }]
  }
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getRecentTokenTransfers(address, contract) {
  try {
    const body = {
      jsonrpc: '2.0', id: 1, method: 'alchemy_getAssetTransfers',
      params: [{ fromBlock: '0x0', toAddress: address, contractAddresses: [contract],
                 category: ['erc20'], withMetadata: true }]
    }
    const res = await fetch(process.env.ALCHEMY_TESTNET_RPC_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    })
    const data = await res.json()
    const cutoff = Date.now() - 3*24*60*60*1000
    return (data.result?.transfers || []).filter(tx =>
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
    const quoteData = await getQuote(
      fromAddr,
      toAddr,
      ethers.parseUnits('1', DECIMALS_CACHE['USDC'] || 6).toString(),
      ZERO_ADDRESS
    )
    const str = quoteData?.quote?.output_formatted ?? quoteData.output_formatted
    const price = parseFloat(str) || 0
    PRICE_CACHE[key] = price
    return price
  } catch {
    return 0
  }
}
