// mcp-server/services/swapService.js
import fetch from 'node-fetch'

const {
  MONORAIL_API_URL = 'https://testnet-pathfinder-v2.monorail.xyz',
  SLIPPAGE         = '50',
  DEADLINE         = '60',
  MAX_HOPS         = '3'
} = process.env

/**
 * Fetches a swap quote from Monorail, with logging and response validation.
 * @param {string} from   - source token address
 * @param {string} to     - destination token address
 * @param {string} amount - amount in wei/base units
 * @param {string} sender - sender address
 * @returns {Promise<object>} - parsed JSON quote response
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

  // 1) Debug log the raw Monorail response (truncated to 200 chars)
  console.log('🧩 Monorail raw quote response:', JSON.stringify(data).slice(0, 200))

  // 2) HTTP-level error
  if (!resp.ok) {
    throw new Error(data.error || `HTTP ${resp.status}`)
  }

  // 3) Validate expected quote format
  if (!data.quote || typeof data.quote.output_formatted !== 'string') {
    throw new Error('Monorail quote missing output_formatted')
  }

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