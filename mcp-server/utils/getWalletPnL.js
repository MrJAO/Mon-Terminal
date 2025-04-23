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

// Zero address used for quote calls when sender is not relevant
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Calculates PnL for a specific amount of token swapped to a destination token.
 * @param {string} address - User wallet address
 * @param {string} tokenSymbol - Symbol of the token to evaluate
 * @param {number} amountRequested - Amount of token to quote (defaults to 1)
 * @param {string} toSymbol - Destination token symbol (defaults to 'USDC')
 * @returns {Promise<Array>} - Array containing PnL details or error
 */
export async function getWalletPnL(address, tokenSymbol, amountRequested = 1, toSymbol = 'USDC') {
  // Find token and destination token metadata
  const token = TOKEN_LIST.find(t => t.symbol.toUpperCase() === tokenSymbol.toUpperCase())
  const toToken = TOKEN_LIST.find(t => t.symbol.toUpperCase() === toSymbol.toUpperCase())

  if (!token) {
    return [{ symbol: tokenSymbol, error: 'Token not found in list.' }]
  }
  if (!toToken) {
    return [{ symbol: toSymbol, error: 'Destination token not found.' }]
  }

  try {
    // Ensure valid checksum address
    const checksummedAddress = ethers.getAddress(address)
    const decimals = DECIMALS_CACHE[token.symbol] || 18

    // 1) Calculate average buy price per unit from recent transfers
    let totalCost = 0
    let totalAmount = 0

    // Fetch recent ERC20 transfers (skip native)
    if (token.address !== 'native') {
      const transfers = await getRecentTokenTransfers(checksummedAddress, token.address)
      for (const tx of transfers) {
        const amount = parseFloat(ethers.formatUnits(tx.rawContract.value, decimals))
        const price = await getPriceFromMonorail(token.address, toToken.address)
        if (!price) continue
        totalAmount += amount
        totalCost += amount * price
      }
    }

    const averageBuyPrice = totalAmount > 0 ? totalCost / totalAmount : 0

    // 2) Quote the requested amount via Monorail
    const amountUnits = ethers.parseUnits(amountRequested.toString(), decimals).toString()
    const quoteData = await getQuote(token.address, toToken.address, amountUnits, ZERO_ADDRESS)
    const outAmount = parseFloat(quoteData.quote.output_formatted)

    // 3) Compute cost and PnL for the requested amount
    const costForAmount = averageBuyPrice * amountRequested
    const pnlForAmount = outAmount - costForAmount
    const pnlPercentage = costForAmount > 0 ? (pnlForAmount / costForAmount) * 100 : 0

    return [{
      symbol: token.symbol,
      amount: amountRequested,
      to: toToken.symbol,
      averageBuyPrice: parseFloat(averageBuyPrice.toFixed(6)),
      quotedAmount: outAmount,
      costForAmount: parseFloat(costForAmount.toFixed(6)),
      pnlForAmount: parseFloat(pnlForAmount.toFixed(6)),
      pnlPercentage: parseFloat(pnlPercentage.toFixed(2))
    }]
  } catch (err) {
    console.warn(`[PnL Error] ${tokenSymbol}:`, err.message)
    return [{ symbol: tokenSymbol, error: err.message }]
  }
}

// Helper: fetch recent transfers
async function getRecentTokenTransfers(address, contract) {
  try {
    const body = {
      jsonrpc: '2.0', id: 1, method: 'alchemy_getAssetTransfers',
      params: [{
        fromBlock: '0x0', toAddress: address,
        contractAddresses: [contract], category: ['erc20'], withMetadata: true
      }]
    }
    const res = await fetch(process.env.ALCHEMY_TESTNET_RPC_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000
    return (data.result?.transfers || []).filter(tx => {
      const ts = new Date(tx.metadata.blockTimestamp).getTime()
      return ts > threeDaysAgo
    })
  } catch {
    return []
  }
}

// Helper: dynamic price fetch
const PRICE_CACHE = {}
async function getPriceFromMonorail(fromAddress, toAddress) {
  const key = `${fromAddress}-${toAddress}`
  if (PRICE_CACHE[key]) return PRICE_CACHE[key]
  try {
    const data = await getQuote(fromAddress, toAddress, ethers.parseUnits('1', DECIMALS_CACHE['USDC'] || 6).toString(), ZERO_ADDRESS)
    const price = parseFloat(data.quote.output_formatted)
    PRICE_CACHE[key] = price
    return price
  } catch {
    return 0
  }
}
