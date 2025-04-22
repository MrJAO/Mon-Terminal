// utils/getWalletPnL.js
import { ethers } from 'ethers'
import { provider } from './provider.js'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import fetch from 'node-fetch'

const DECIMALS_CACHE = {
  MON: 18, USDC: 6, USDT: 6, DAK: 18, YAKI: 18, CHOG: 18, WMON: 18, 
  WETH: 18, WBTC: 8, WSOL: 9, BEAN: 18, shMON: 18, MAD: 18, 
  sMON: 18, aprMON: 18, gMON: 18
}

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
]

const FALLBACK_PRICES = {
  MON: 10,
  USDC: 1,
  USDT: 1,
  DAK: 2,
  YAKI: 0.013,
  CHOG: 0.164,
  WMON: 10,
  WETH: 1500,
  WBTC: 75000,
  WSOL: 130,
  BEAN: 2.103,
  shMON: 10,
  MAD: 0.098,
  sMON: 10,
  aprMON: 10,
  gMON: 10
}

// 🔁 In-memory price cache
const PRICE_CACHE = {}

async function getPriceFromMonorail(tokenAddress) {
  if (PRICE_CACHE[tokenAddress]) return PRICE_CACHE[tokenAddress]

  try {
    const res = await fetch('https://testnet-pathfinder-v2.monorail.xyz/v1/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: tokenAddress,
        to: '0xf817257fed379853cDe0fa4F97AB987181B1e5Ea', // USDC
        amount: '1000000000000000000', // 1 token in wei
        sender: '0x0000000000000000000000000000000000000000'
      })
    })

    // Catch non-JSON or error responses
    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      throw new Error(`Invalid JSON: ${text.slice(0, 100)}`)
    }

    if (data.success && data.quote?.output_formatted) {
      const price = parseFloat(data.quote.output_formatted)
      PRICE_CACHE[tokenAddress] = price
      return price
    }

    throw new Error(data.error || 'Invalid quote response')
  } catch (err) {
    console.warn(`[Monorail Price Error] ${tokenAddress}:`, err.message)
    const t = TOKEN_LIST.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase())
    const sym = t?.symbol?.toUpperCase()
    return sym && FALLBACK_PRICES[sym] != null ? FALLBACK_PRICES[sym] : 0
  }
}

async function getRecentTokenTransfers(address, contract) {
  try {
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getAssetTransfers',
      params: [{
        fromBlock: '0x0',
        toAddress: address,
        contractAddresses: [contract],
        category: ['erc20'],
        withMetadata: true
      }]
    }

    const res = await fetch(process.env.ALCHEMY_TESTNET_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await res.json()
    const transfers = data?.result?.transfers || []

    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000
    return transfers.filter(tx => {
      const ts = new Date(tx.metadata.blockTimestamp).getTime()
      return ts > threeDaysAgo
    })
  } catch (err) {
    console.warn(`[Alchemy Transfers Error] ${contract}:`, err.message)
    return []
  }
}

export async function getWalletPnL(address, tokenSymbol) {
  const token = TOKEN_LIST.find(t => t.symbol.toUpperCase() === tokenSymbol.toUpperCase())

  if (!token) {
    return [{ symbol: tokenSymbol, error: 'Token not found in list.' }]
  }

  try {
    const checksummedAddress = ethers.getAddress(address)
    const decimals = DECIMALS_CACHE[token.symbol] || 18
    const transfers = token.address === 'native'
      ? []
      : await getRecentTokenTransfers(checksummedAddress, token.address)

    let totalCost = 0
    let totalAmount = 0

    for (const tx of transfers) {
      const amount = parseFloat(ethers.formatUnits(tx.rawContract.value, decimals))
      const price = await getPriceFromMonorail(token.address)
      if (!price) continue

      totalAmount += amount
      totalCost += amount * price
    }

    const avgPrice = totalAmount > 0 ? totalCost / totalAmount : 0

    let rawBalance
    if (token.address === 'native') {
      rawBalance = await provider.getBalance(checksummedAddress)
    } else {
      const contract = new ethers.Contract(token.address, ERC20_ABI, provider)
      rawBalance = await contract.balanceOf(checksummedAddress)
    }

    const currentBalance = parseFloat(ethers.formatUnits(rawBalance, decimals))
    const currentPrice = await getPriceFromMonorail(token.address)
    const currentValue = currentBalance * currentPrice
    const pnl = currentValue - totalCost

    return [{
      symbol: token.symbol,
      averageBuyPrice: avgPrice,
      currentPrice,
      currentBalance,
      currentValue,
      totalCost,
      pnl: parseFloat(pnl.toFixed(6))
    }]
  } catch (err) {
    console.warn(`[PnL Error] ${tokenSymbol}:`, err.message)
    return [{ symbol: tokenSymbol, error: err.message }]
  }
}
