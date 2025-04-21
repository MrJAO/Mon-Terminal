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

const ALCHEMY_RPC_URL = process.env.ALCHEMY_RPC_URL

async function getPriceFromAlchemy(tokenAddress) {
  try {
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getTokenMetadata',
      params: [tokenAddress]
    }

    const res = await fetch(ALCHEMY_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await res.json()
    return parseFloat(data.result?.price?.usd || 0)
  } catch (err) {
    console.warn(`[Alchemy Price Error] ${tokenAddress}:`, err.message)
    return 0
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
        maxCount: '0x5',
        withMetadata: true
      }]
    }

    const res = await fetch(ALCHEMY_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await res.json()
    return data?.result?.transfers || []
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
    const transfers = token.address === 'native' ? [] : await getRecentTokenTransfers(checksummedAddress, token.address)

    let totalCost = 0
    let totalAmount = 0

    for (const tx of transfers) {
      const amount = parseFloat(ethers.formatUnits(tx.rawContract.value, decimals))
      const price = await getPriceFromAlchemy(token.address)
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
    const currentPrice = await getPriceFromAlchemy(token.address)
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
