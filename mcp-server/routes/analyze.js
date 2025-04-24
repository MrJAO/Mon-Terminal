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
    console.log(`➡️ RPC call: alchemy_getAssetTransfers with params ${JSON.stringify(rpcParams)}`);
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

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Alchemy error ${response.status}: ${text}`);
      throw new Error(`Alchemy error: ${response.status} ${response.statusText}`);
    }
    const json = await response.json();
    if (json.error) {
      console.error(`❌ RPC error: ${json.error.message}`);
      throw new Error(json.error.message);
    }

    transfers.push(...(json.result.transfers || []));
    pageKey = json.result.pageKey;
    console.log(`🔄 Received ${json.result.transfers.length} transfers, next pageKey=${pageKey}`);
    tries++;
  } while (pageKey && tries < 10);

  console.log(`✅ Total fetched transfers: ${transfers.length}`);
  return transfers;
}

// Count all transaction categories except unsupported ones
async function getTransactionCount(address) {
  console.log(`🧮 Counting transactions for ${address}`);
  const transfers = await fetchAllTransfers({
    fromAddress:     address,
    category:        ['external', 'erc20', 'erc721', 'erc1155'],
    excludeZeroValue: true,
    withMetadata:     false,
    maxCount:         '0x3e8'
  });
  console.log(`📊 Transaction count: ${transfers.length}`);
  return transfers.length;
}

// Count interactions with a specific ERC-20 token
async function getTokenInteractionCount(address, tokenAddress) {
  console.log(`🔁 Counting ERC20 interactions for token ${tokenAddress} and owner ${address}`);
  const transfers = await fetchAllTransfers({
    contractAddresses: [tokenAddress],
    category:          ['erc20'],
    withMetadata:      false,
    maxCount:          '0x3e8',
    toAddress:         address,
    fromAddress:       address
  });
  console.log(`📊 Interaction count for ${tokenAddress}: ${transfers.length}`);
  return transfers.length;
}

// Fetch NFTs for given owner, filtering only known contracts
async function getNFTs(owner) {
  const contractAddresses = Object.values(nftContracts).map(v => typeof v === 'string' ? v : v.address);
  const url = new URL(`${NFT_URL}/getNFTsForOwner`);
  url.searchParams.set('owner', owner);
  contractAddresses.forEach(addr => url.searchParams.append('contractAddresses[]', addr));
  url.searchParams.set('withMetadata', 'false');
  console.log(`📡 Fetching NFTs for ${owner} with contracts ${contractAddresses}`);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errText = await response.text();
    console.error(`❌ NFT API error ${response.status}: ${errText}`);
    throw new Error(`Alchemy NFT error: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  console.log(`✅ NFT API returned ${json.ownedNfts?.length || 0} items`);
  return json.ownedNfts || [];
}

router.post('/', async (req, res) => {
  const { address, command } = req.body;
  console.log(`🔍 Analyze requested: address=${address}, command=${command}`);
  try {
    if (command !== 'analyze' || !isValidAddress(address)) {
      console.warn('⚠️ Invalid command or address');
      return res.status(400).json({ success: false, message: 'Invalid command or address' });
    }

    // Transactions
    const totalTxCount = await getTransactionCount(address);
    let activityLevel = 'Low';
    if (totalTxCount >= 5000) activityLevel = 'High';
    else if (totalTxCount >= 1000) activityLevel = 'Intermediate';
    else if (totalTxCount >= 200) activityLevel = 'Fair';
    console.log(`⚡ Activity level: ${activityLevel}`);

    // Token stats
    const tokenStats = {};
    for (const token of tokenContracts) {
      console.log(`🔄 Processing token ${token.symbol}`);
      const count = await getTokenInteractionCount(address, token.address);
      tokenStats[token.symbol] = count;
    }
    console.log('🔢 Token stats:', tokenStats);

    // NFT holdings
    console.log('📦 Fetching NFT holdings');
    const nfts = await getNFTs(address);
    const nftHoldings = Object.entries(nftContracts).map(([label, data]) => {
      const addr = typeof data === 'string' ? data : data.address;
      const threshold = typeof data === 'string' ? 1 : data.threshold || 1;
      const count = nfts.filter(n => n.contract?.address?.toLowerCase() === addr.toLowerCase()).length;
      const status = count >= threshold ? 'Confirm' : count > 0 ? 'Incomplete' : 'Not Holding';
      return { name: label, count, status };
    });
    console.log('🎯 NFT holdings:', nftHoldings);

    console.log('✅ Sending analyze response');
    return res.json({ success: true, data: { totalTxCount, activityLevel, tokenStats, nftHoldings } });
  } catch (err) {
    console.error('❌ Analyze error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;