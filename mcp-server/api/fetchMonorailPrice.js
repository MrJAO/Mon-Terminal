// api/fetchMonorailPrice.js
import { getQuote } from './quoteService.js'
import TOKEN_LIST from '../../src/constants/tokenList.js'

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

export async function fetchMonorailPrice(symbol) {
  // Find the token entry (case‑insensitive)
  const tokenEntry = TOKEN_LIST.find(
    t => t.symbol.toUpperCase() === symbol.toUpperCase()
  )
  if (!tokenEntry) {
    throw new Error(`Token ${symbol} not found in TOKEN_LIST`)
  }

  // For MON, we actually quote WMON → USDC; otherwise the token itself
  const actualSymbol = symbol.toUpperCase() === 'MON' ? 'WMON' : symbol.toUpperCase()
  const fromEntry = TOKEN_LIST.find(
    t => t.symbol.toUpperCase() === actualSymbol
  )
  if (!fromEntry?.address) {
    throw new Error(`Unable to resolve address for ${actualSymbol}`)
  }

  // Build a 1‑unit amount (10^decimals)
  const decimals = DECIMALS_MAP[actualSymbol] ?? 18
  const amount = (BigInt(10) ** BigInt(decimals)).toString()

  try {
    // Ask Monorail for the quote
    const data = await getQuote({
      from:   fromEntry.address,
      to:     USDC_ADDRESS,
      amount,
      sender: NULL_SENDER
    })

    // Try the various output formats
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
    // Fall back to your hardcoded map
    return FALLBACK_PRICES[actualSymbol] ?? 0
  }
}
