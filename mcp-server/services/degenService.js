// mcp-server/services/degenService.js
import fetch from 'node-fetch';

const DEGEN_BASE =
  process.env.DEGEN_API_URL ||
  'https://testnet-bot-api-server.nad.fun';

/**
 * Fetch a quote for a degen swap.
 * @param {string} contractAddress
 * @returns {Promise<{ price: string }>}  // or throws on error
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
 * Execute a confirmed degen swap.
 * @param {{ from: string, to: string, amount: string, sender: string }} payload
 * @returns {Promise<{ success: boolean, transaction: { hash: string } }>}
 */
export async function confirmSwap(payload) {
  const url = `${DEGEN_BASE}/swap`;
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Swap confirm failed (${res.status}): ${text}`);
  }
  return res.json();
}
