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

const TESTNET_PRICE_FALLBACK = {
  MON: 10, USDC: 1, USDT: 1, DAK: 2, YAKI: 0.013, CHOG: 0.164, WMON: 10,
  WETH: 1500, WBTC: 75000, WSOL: 130, BEAN: 2.103, shMON: 10, MAD: 0.098,
  sMON: 10, aprMON: 10, gMON: 10
}

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
]

// Get token price from Monorail API quote endpoint
async function getPriceFromMonorail(fromToken, symbol) {
  try {
    const url = new URL(`https://testnet-pathfinder-v2.monorail.xyz/v1/quote`)
    url.searchParams.set('from', fromToken)
    url.searchParams.set('to', 'native')
    url.searchParams.set('amount', 1)
    url.searchParams.set('sender', '0x0000000000000000000000000000000000000001')
    url.searchParams.set('slippage', '100')
    url.searchParams.set('deadline', '60')

    const res = await fetch(url.toString())
    const data = await res.json()

    if (data?.output_formatted && data?.input_formatted) {
      return parseFloat(data.output_formatted) / parseFloat(data.input_formatted)
    }
  } catch (err) {
    console.warn(`[Monorail Price Error] ${symbol}:`, err.message)
  }
  return TESTNET_PRICE_FALLBACK[symbol.toUpperCase()] || 0
}

async function getRecentTokenTransfers(address, contract) {
  const ALCHEMY_URL = process.env.ALCHEMY_RPC_URL
  const ALCHEMY_HEADERS = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.ALCHEMY_API_KEY}`
  }

  if (!ALCHEMY_URL) throw new Error('Missing ALCHEMY_RPC_URL in environment variables')

  const body = {
    id: 1,
    jsonrpc: '2.0',
    method: 'alchemy_getAssetTransfers',
    params: [{
      fromBlock: '0x0',
      toAddress: address,
      contractAddresses: [contract],
      category: ['erc20'],
      maxCount: '0x5',
      withMetadata: true
    }]
  }

  const res = await fetch(ALCHEMY_URL, {
    method: 'POST',
    headers: ALCHEMY_HEADERS,
    body: JSON.stringify(body)
  })

  const data = await res.json()
  return data?.result?.transfers || []
}

export async function getWalletPnL(address, tokenSymbol) {
  const token = TOKEN_LIST.find(t => t.symbol.toUpperCase() === tokenSymbol.toUpperCase())

  if (!token) {
    return [{ symbol: tokenSymbol, error: 'Token not found in list.' }]
  }

  try {
    const checksummedAddress = ethers.getAddress(address)
    const decimals = DECIMALS_CACHE[token.symbol] || 18
    const transfers = token.address === 'native' ? [] : await getRecentTokenTransfers(checksummedAddress, token.address)

    let totalCost = 0
    let totalAmount = 0

    for (const tx of transfers) {
      const amount = parseFloat(ethers.formatUnits(tx.rawContract.value, decimals))
      const price = await getPriceFromMonorail(token.address, token.symbol)
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
    const currentPrice = await getPriceFromMonorail(token.address, token.symbol)
    const currentValue = currentBalance * currentPrice
    const pnl = currentValue - totalCost

    return [{
      symbol: token.symbol,
      averageBuyPrice: avgPrice,
      currentPrice: currentPrice,
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
