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
const TRANSFERS_URL = `https://monad-testnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const NFT_URL       = `https://monad-testnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

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
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [rpcParams]
      })
    });

    if (!response.ok) throw new Error(`Alchemy error: ${response.status} ${await response.text()}`);
    const json = await response.json();
    if (json.error) throw new Error(json.error.message);

    transfers.push(...(json.result.transfers || []));
    pageKey = json.result.pageKey;
    tries++;
  } while (pageKey && tries < 10);

  return transfers;
}

// Count all transaction categories except unsupported ones
async function getTransactionCount(address) {
  const transfers = await fetchAllTransfers({
    fromAddress:     address,
    category:        ['external', 'erc20', 'erc721', 'erc1155'],
    excludeZeroValue: true,
    withMetadata:     false,
    maxCount:         '0x3e8'
  });
  return transfers.length;
}

// Count interactions with a specific ERC-20 token
async function getTokenInteractionCount(address, tokenAddress) {
  const transfers = await fetchAllTransfers({
    contractAddresses: [tokenAddress],
    category:          ['erc20'],
    withMetadata:      false,
    maxCount:          '0x3e8',
    toAddress:         address,
    fromAddress:       address
  });
  return transfers.length;
}

// Fetch NFTs for given owner, filtering only known contracts
async function getNFTs(owner) {
  // Collect all NFT contract addresses from helpers
  const contractAddresses = Object.values(nftContracts).map(v => typeof v === 'string' ? v : v.address);
  const url = new URL(`${NFT_URL}/getNFTsForOwner`);
  url.searchParams.set('owner', owner);
  contractAddresses.forEach(addr => url.searchParams.append('contractAddresses[]', addr));
  url.searchParams.set('withMetadata', 'false');

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Alchemy NFT error: ${response.status} ${await response.text()}`);
  const json = await response.json();
  return json.ownedNfts || [];
}

router.post('/', async (req, res) => {
  try {
    const { address, command } = req.body;
    if (command !== 'analyze' || !isValidAddress(address)) {
      return res.status(400).json({ error: 'Invalid command or address' });
    }

    const totalTxCount = await getTransactionCount(address);
    let activityLevel = 'Low';
    if (totalTxCount >= 5000) activityLevel = 'High';
    else if (totalTxCount >= 1000) activityLevel = 'Intermediate';
    else if (totalTxCount >= 200) activityLevel = 'Fair';

    const tokenStats = {};
    for (const token of tokenContracts) {
      tokenStats[token.symbol] = await getTokenInteractionCount(address, token.address);
    }

    const nfts = await getNFTs(address);
    const nftHoldings = Object.entries(nftContracts).map(([label, data]) => {
      const addr = typeof data === 'string' ? data : data.address;
      const threshold = typeof data === 'string' ? 1 : data.threshold || 1;
      const count = nfts.filter(n => n.contract?.address?.toLowerCase() === addr.toLowerCase()).length;
      const status = count >= threshold ? 'Confirm'
                   : count > 0        ? 'Incomplete'
                   :                      'Not Holding';
      return { name: label, count, status };
    });

    return res.json({ totalTxCount, activityLevel, tokenStats, nftHoldings });
  } catch (err) {
    console.error('❌ Analyze error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
