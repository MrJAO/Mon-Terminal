import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';
import { tokenContracts, nftContracts } from '../helpers/analyzeContracts.js';

dotenv.config();

const router = express.Router();
// Enable CORS and JSON parsing
router.use(cors());
router.use(express.json());

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const TRANSFERS_URL   = `https://monad-testnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const NFT_URL         = `https://monad-testnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

function isValidAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

// Generic paginated transfer fetcher
async function fetchAllTransfers(params) {
  const transfers = [];
  let pageKey;
  let tries = 0;
  do {
    const rpcParams = { ...params, ...(pageKey ? { pageKey } : {}) };
    const response = await fetch(TRANSFERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'alchemy_getAssetTransfers', params: [rpcParams] })
    });
    if (!response.ok) throw new Error(`Alchemy error: ${response.status}`);
    const json = await response.json();
    if (json.error) throw new Error(json.error.message);
    transfers.push(...(json.result.transfers || []));
    pageKey = json.result.pageKey;
    tries++;
  } while (pageKey && tries < 10);
  return transfers;
}

// 1️⃣ Total transaction count
async function getTransactionCount(address) {
  const transfers = await fetchAllTransfers({
    fromAddress:     address,
    category:        ['external','erc20','erc721','erc1155'],
    excludeZeroValue: true,
    withMetadata:     false,
    maxCount:         '0x3e8'
  });
  return transfers.length;
}

// 2️⃣ Token interaction stats (parallel)
async function getAllTokenStats(address) {
  const entries = await Promise.all(
    tokenContracts.map(({ symbol, address: tokenAddr }) =>
      fetchAllTransfers({
        contractAddresses: [tokenAddr],
        category:          ['erc20'],
        withMetadata:      false,
        maxCount:          '0x3e8',
        toAddress:         address,
        fromAddress:       address
      })
      .then(transfers => [symbol, transfers.length])
    )
  );
  return Object.fromEntries(entries);
}

// 3️⃣ NFT holdings
async function getNFTHoldings(address) {
  const contractAddrs = Object.values(nftContracts).map(v => typeof v === 'string' ? v : v.address);
  const url = new URL(`${NFT_URL}/getNFTsForOwner`);
  url.searchParams.set('owner', address);
  contractAddrs.forEach(a => url.searchParams.append('contractAddresses[]', a));
  url.searchParams.set('withMetadata','false');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`NFT API error: ${res.status}`);
  const json = await res.json();
  const nfts = json.ownedNfts || [];
  return Object.entries(nftContracts).map(([label, data]) => {
    const addr = typeof data === 'string' ? data : data.address;
    const threshold = typeof data === 'string' ? 1 : data.threshold || 1;
    const count = nfts.filter(n => n.contract?.address?.toLowerCase()===addr.toLowerCase()).length;
    const status = count>=threshold ? 'Confirm' : count>0 ? 'Incomplete' : 'Not Holding';
    return { name: label, count, status };
  });
}

// Route: tx-count
router.post('/tx-count', async (req, res) => {
  const { address } = req.body;
  if (!isValidAddress(address)) return res.status(400).json({ success:false, message:'Invalid address' });
  try {
    const totalTxCount = await getTransactionCount(address);
    return res.json({ success:true, totalTxCount });
  } catch (err) {
    return res.status(500).json({ success:false, message:err.message });
  }
});

// Route: token-stats
router.post('/token-stats', async (req, res) => {
  const { address } = req.body;
  if (!isValidAddress(address)) return res.status(400).json({ success:false, message:'Invalid address' });
  try {
    const tokenStats = await getAllTokenStats(address);
    return res.json({ success:true, tokenStats });
  } catch (err) {
    return res.status(500).json({ success:false, message:err.message });
  }
});

// Route: nft-holdings
router.post('/nft-holdings', async (req, res) => {
  const { address } = req.body;
  if (!isValidAddress(address)) return res.status(400).json({ success:false, message:'Invalid address' });
  try {
    const nftHoldings = await getNFTHoldings(address);
    return res.json({ success:true, nftHoldings });
  } catch (err) {
    return res.status(500).json({ success:false, message:err.message });
  }
});

export default router;