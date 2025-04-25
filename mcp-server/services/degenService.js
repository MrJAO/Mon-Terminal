// mcp-server/services/degenService.js
import fetch from 'node-fetch';

// Upstream Nad.fun API base URL (set via env, e.g. https://api.nad.fun)
const DEGEN_BASE =
  process.env.DEGEN_API_URL ||
  'https://api.nad.fun';

/**
 * Fetch a quote for degen swaps from the Nad.fun endpoint.
 * @param {string} contractAddress - The market contract address to quote.
 * @returns {Promise<{ price: string, error?: string }>}  
 */
export async function getQuote(contractAddress) {
  const url = `${DEGEN_BASE}/quote/${contractAddress}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Quote fetch failed (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * Execute a confirmed degen swap via the Nad.fun endpoint.
 * @param {object} payload - { from, to, amount, sender }
 * @returns {Promise<{ success: boolean, transaction: { hash: string }, error?: string }>}  
 */
export async function confirmSwap(payload) {
  const url = `${DEGEN_BASE}/swap`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Swap confirm failed (${res.status}): ${text}`);
  }
  return res.json();
}
