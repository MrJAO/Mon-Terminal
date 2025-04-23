// mcp-server/services/swapService.js
import fetch from 'node-fetch'
const {
  MONORAIL_API_URL = 'https://testnet-pathfinder-v2.monorail.xyz',
  SLIPPAGE = '50',
  DEADLINE = '60',
  MAX_HOPS = '3'
} = process.env

export async function getQuote(from, to, amount, sender) {
  const url = new URL(`${MONORAIL_API_URL}/v1/quote`)
  url.searchParams.set('from', from)
  url.searchParams.set('to', to)
  url.searchParams.set('amount', amount)
  url.searchParams.set('sender', sender)
  url.searchParams.set('slippage', SLIPPAGE)
  url.searchParams.set('deadline', DEADLINE)
  url.searchParams.set('max_hops', MAX_HOPS)
  url.searchParams.set('source', 'mon-terminal')

  const resp = await fetch(url.toString())
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }))
    throw new Error(err.error || `HTTP ${resp.status}`)
  }
  return resp.json()
}

export async function buildSwap(from, to, amount, sender) {
  const url = new URL(`${MONORAIL_API_URL}/v1/quote`)
  url.searchParams.set('from', from)
  url.searchParams.set('to', to)
  url.searchParams.set('amount', amount)
  url.searchParams.set('sender', sender)
  url.searchParams.set('slippage', SLIPPAGE)
  url.searchParams.set('deadline', DEADLINE)
  url.searchParams.set('max_hops', MAX_HOPS)
  url.searchParams.set('source', 'mon-terminal')
  url.searchParams.set('build', 'true')

  const resp = await fetch(url.toString())
  const raw  = await resp.text()
  let json
  try { json = JSON.parse(raw) }
  catch { throw new Error(`Non-JSON response: ${raw}`) }

  if (!resp.ok) throw new Error(json.error || `HTTP ${resp.status}`)
  return json.transaction
}
