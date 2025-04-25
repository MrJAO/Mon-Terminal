// mcp-server/services/degenService.js
import fetch from 'node-fetch';

const DEGEN_BASE = process.env.DEGEN_API_URL || 'https://mon-terminal.onrender.com/api/degen';

/**
 * Fetch a quote for degen swaps from your degen endpoint.
 * @param {string} contractAddress
 * @returns {Promise<{ price: string, error?: string, ... }>}  
 */
export async function getQuote(contractAddress) {
  const res = await fetch(`${DEGEN_BASE}/quote/${contractAddress}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Quote fetch failed: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Submit a confirmed degen swap to your degen endpoint.
 * @param {object} payload
 * @returns {Promise<{ success: boolean, transaction?: { hash: string }, error?: string }>}
 */
export async function confirmSwap(payload) {
  const res = await fetch(`${DEGEN_BASE}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Degen confirm failed: ${res.status} ${text}`);
  }
  return res.json();
}