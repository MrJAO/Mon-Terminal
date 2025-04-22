// api/fetchMonorailPrice.js
import { getQuote } from './quoteService.js'
import TOKEN_LIST from '../../src/constants/tokenList.js'
import { ethers } from 'ethers'
import { provider } from '../utils/provider.js'  // your JSON‐RPC provider

const FALLBACK_PRICES = {
  MON: 10, USDC: 1, USDT: 1, DAK: 2, YAKI: 0.013, CHOG: 0.164,
  WMON: 10, WETH: 1500, WBTC: 75000, WSOL: 130, BEAN: 2.103,
  shMON: 10, MAD: 0.098, sMON: 10, aprMON: 10, gMON: 10
}

const DECIMALS_MAP = {
  MON: 18, USDC: 6, USDT: 6, DAK: 18, YAKI: 18, CHOG: 18, WMON: 18,
  WETH: 18, WBTC: 8, WSOL: 9, BEAN: 18, shMON: 18, MAD: 18,
  sMON: 18, aprMON: 18, gMON: 18
}

const USDC_ADDRESS = '0xf817257fed379853cDe0fa4F97AB987181B1e5Ea'
const NULL_SENDER   = '0x0000000000000000000000000000000000000000'

const ERC20_DECIMALS_ABI = ['function decimals() view returns (uint8)']

export async function fetchMonorailPrice(symbol) {
  // 1) Resolve the token entry (case‐insensitive)
  const symUpper = symbol.toUpperCase()
  const tokenEntry = TOKEN_LIST.find(t => t.symbol.toUpperCase() === symUpper)
  if (!tokenEntry) {
    throw new Error(`Token ${symbol} not found in TOKEN_LIST`)
  }

  // 2) For MON use WMON as the "from" asset, otherwise the token itself
  const actualSymbol = symUpper === 'MON' ? 'WMON' : symUpper
  const fromEntry = TOKEN_LIST.find(t => t.symbol.toUpperCase() === actualSymbol)
  if (!fromEntry?.address) {
    throw new Error(`Unable to resolve address for ${actualSymbol}`)
  }

  // 3) Figure out decimals: try on‐chain, fall back to DECIMALS_MAP, then to 18
  let decimals
  if (DECIMALS_MAP[actualSymbol] != null) {
    decimals = DECIMALS_MAP[actualSymbol]
  } else {
    try {
      const contract = new ethers.Contract(fromEntry.address, ERC20_DECIMALS_ABI, provider)
      decimals = await contract.decimals()
    } catch {
      decimals = 18
    }
  }

  // 4) Build a 1‑unit amount in raw integer form
  const amount = (BigInt(10) ** BigInt(decimals)).toString()

  try {
    // 5) Query Monorail
    const data = await getQuote({
      from:   fromEntry.address,
      to:     USDC_ADDRESS,
      amount,
      sender: NULL_SENDER
    })

    // 6) Normalize across Monorail’s response shapes
    const formatted = data?.output_formatted
      ?? data?.quote?.output_formatted
      ?? data?.output?.formatted

    const price = parseFloat(formatted)
    if (!isNaN(price)) {
      return price
    } else {
      throw new Error(`Invalid formatted price: ${formatted}`)
    }
  } catch (err) {
    console.warn(`[Monorail Price Error] ${symbol}: ${err.message}`)
    return FALLBACK_PRICES[actualSymbol] ?? 0
  }
}
