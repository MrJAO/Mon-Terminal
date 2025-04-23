// mcp-server/services/swapService.js
import fetch from 'node-fetch'
import { ethers } from 'ethers'

const {
  MONORAIL_API_URL = 'https://testnet-pathfinder-v2.monorail.xyz',
  SLIPPAGE         = '50',
  DEADLINE         = '60',
  MAX_HOPS         = '3'
} = process.env

/**
 * Fetches a swap quote from Monorail, normalizes shape, and injects correct formatting.
 * @param {string} from   - source token address
 * @param {string} to     - destination token address
 * @param {string} amount - amount in wei/base units
 * @param {string} sender - sender address
 * @returns {Promise<object>} - full Monorail response with `quote.output_formatted`
 */
export async function getQuote(from, to, amount, sender) {
  const url = new URL(`${MONORAIL_API_URL}/v1/quote`)
  url.searchParams.set('from',     from)
  url.searchParams.set('to',       to)
  url.searchParams.set('amount',   amount)
  url.searchParams.set('sender',   sender)
  url.searchParams.set('slippage', SLIPPAGE)
  url.searchParams.set('deadline', DEADLINE)
  url.searchParams.set('max_hops', MAX_HOPS)
  url.searchParams.set('source',   'mon-terminal')

  const resp = await fetch(url.toString())
  const data = await resp.json()

  // 1) Debug log the raw Monorail response
  console.log('🧩 Monorail raw quote response:', JSON.stringify(data).slice(0, 200))

  // 2) HTTP-level error
  if (!resp.ok) {
    throw new Error(data.error || `HTTP ${resp.status}`)
  }

  // 3) Normalize wrapper: handle both nested and flat responses
  const quote = data.quote ?? data
  if (typeof quote.output !== 'string') {
    throw new Error('Malformed quote response from Monorail')
  }

  // 4) Use Monorail's own formatted output or fallback to standard 6-decimal formatting
  quote.output_formatted = quote.output_formatted || ethers.formatUnits(quote.output, 6)

  // 5) Attach back so callers see `data.quote.output_formatted`
  data.quote = quote
  return data
}

/**
 * Builds a swap transaction via Monorail Pathfinder.
 * @param {string} from   - source token address
 * @param {string} to     - destination token address
 * @param {string} amount - amount in wei/base units
 * @param {string} sender - sender address
 * @returns {Promise<object>} - transaction object with to, data, value
 */
export async function buildSwap(from, to, amount, sender) {
  const url = new URL(`${MONORAIL_API_URL}/v1/quote`)
  url.searchParams.set('from',     from)
  url.searchParams.set('to',       to)
  url.searchParams.set('amount',   amount)
  url.searchParams.set('sender',   sender)
  url.searchParams.set('slippage', SLIPPAGE)
  url.searchParams.set('deadline', DEADLINE)
  url.searchParams.set('max_hops', MAX_HOPS)
  url.searchParams.set('source',   'mon-terminal')
  url.searchParams.set('build',    'true')

  const resp = await fetch(url.toString())
  const raw  = await resp.text()
  let json
  try {
    json = JSON.parse(raw)
  } catch {
    throw new Error(`Non-JSON response: ${raw}`)
  }

  if (!resp.ok) throw new Error(json.error || `HTTP ${resp.status}`)
  return json.transaction
}
