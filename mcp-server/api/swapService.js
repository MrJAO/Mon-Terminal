// api/swapService.js
import fetch from 'node-fetch'

export async function buildSwap({ from, to, amount, sender }) {
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
  url.searchParams.set('build', 'true')

  const resp = await fetch(url.toString())
  const raw = await resp.text()

  let json
  try {
    json = JSON.parse(raw)
  } catch {
    throw new Error(`Non-JSON response: ${raw}`)
  }

  if (!resp.ok) {
    throw new Error(json?.error || `Build failed: ${raw}`)
  }

  const rawTx = json.transaction?.rawTransaction || json.rawTransaction
  if (!rawTx) {
    throw new Error('Missing rawTransaction in response')
  }

  return rawTx
}
