import { ethers } from 'ethers'
import dotenv from 'dotenv'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { provider } from './provider.js'

dotenv.config()

// Standard ERC-20 ABI fragment for balanceOf and decimals
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
]

export async function getTokenBalance(address, symbol) {
  const token = TOKEN_LIST.find(t => t.symbol.toLowerCase() === symbol.toLowerCase())
  if (!token) throw new Error(`Token ${symbol} not found in list.`)

  if (token.address === 'native') {
    const balance = await provider.getBalance(address)
    return {
      symbol: 'MON',
      formatted: ethers.formatUnits(balance, 18),
    }
  } else {
    const contract = new ethers.Contract(token.address, ERC20_ABI, provider)
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(address),
      contract.decimals(),
    ])
    return {
      symbol,
      formatted: ethers.formatUnits(balance, decimals),
    }
  }
}
