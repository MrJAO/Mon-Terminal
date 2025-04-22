// api/quoteService.js
import fetch from 'node-fetch'

export async function getQuote({ from, to, amount, sender }) {
  const {
    MONORAIL_API_URL = 'https://testnet-pathfinder-v2.monorail.xyz',
    SLIPPAGE = '50',
    DEADLINE = '60',
    MAX_HOPS = '3'
  } = process.env

  const url = new URL(`${MONORAIL_API_URL}/v1/quote`)
  url.searchParams.set('from', from)
  url.searchParams.set('to', to)
  url.searchParams.set('amount', amount)
  url.searchParams.set('sender', sender)
  url.searchParams.set('slippage', SLIPPAGE)
  url.searchParams.set('deadline', DEADLINE)
  url.searchParams.set('max_hops', MAX_HOPS)
  url.searchParams.set('source', 'mon-terminal')

  const response = await fetch(url.toString())
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error || 'Quote failed')
  }

  return data
}
