// utils/fetchMonorailPrice.js
import { getQuote } from '../api/quoteService.js'
import TOKEN_LIST from '../../src/constants/tokenList.js'

export async function fetchMonorailPrice(tokenSymbol) {
  const token = TOKEN_LIST.find(t => t.symbol.toUpperCase() === tokenSymbol.toUpperCase())
  if (!token) throw new Error(`Token ${tokenSymbol} not found`)

  const from = token.address
  const to = '0xf817257fed379853cDe0fa4F97AB987181B1e5Ea' // USDC
  const sender = '0x0000000000000000000000000000000000000000'
  const amount = token.decimals === 6 ? '1000000' : '1000000000000000000'

  const quote = await getQuote({ from, to, amount, sender })
  return parseFloat(quote.output_formatted)
}
