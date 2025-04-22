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

  // Log full build URL
  console.log('🚀 Build URL:', url.toString())

  const resp = await fetch(url.toString())
  const raw = await resp.text()

  // Log and flush Monorail response even on fatal parse issues
  console.log('📦 Raw Monorail response (pre-parse):', raw)
  await new Promise(resolve => setTimeout(resolve, 100)) // flush logs
  
  let json
  try {
    json = JSON.parse(raw)
  } catch (err) {
    console.error('❌ JSON parse failed:', err.message)
    throw new Error(`Non-JSON response: ${raw}`)
  }  

  // Log parsed response
  console.log('🧾 Monorail build response JSON:', JSON.stringify(json, null, 2))

  if (!resp.ok) {
    throw new Error(json?.error || `Build failed: ${raw}`)
  }

  const rawTx = json.transaction?.rawTransaction || json.rawTransaction
  if (!rawTx) {
    console.warn('⚠️ Monorail returned no rawTransaction. Full payload below:')
    console.warn(JSON.stringify(json, null, 2))
    await new Promise(res => setTimeout(res, 100)) // flush logs before throwing
    throw new Error(`Missing rawTransaction in response. Full payload: ${JSON.stringify(json)}`)
  }  

  return rawTx
}
