// checkNFT.js
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { getContractAddress } from './NFTContracts.js';

dotenv.config();

const router = express.Router();
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_BASE_URL = `https://monad-testnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

function isValidAddress(str) {
  return /^0x[a-fA-F0-9]{40}$/.test(str);
}

async function fetchNFTs(owner, contractAddresses = []) {
  const url = new URL(`${ALCHEMY_BASE_URL}/getNFTsForOwner`);
  url.searchParams.set('owner', owner);
  contractAddresses.forEach(addr => url.searchParams.append('contractAddresses[]', addr));
  url.searchParams.set('withMetadata', 'true');
  url.searchParams.set('pageSize', '100');

  console.log(`🔍 Fetching NFTs for ${owner}`);
  console.log(`🧩 With contracts:`, contractAddresses);
  console.log(`📡 Fetching: ${url.toString()}`);

  const res = await fetch(url.toString());

  if (!res.ok) {
    const errText = await res.text();
    console.error(`❌ Alchemy API error [${res.status}]: ${errText}`);
    throw new Error(`Alchemy API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const nfts = data.ownedNfts || data.ownedNFTs || [];

  console.log(`✅ Alchemy returned ${nfts.length} NFTs`);

  return nfts;
}

router.post('/', async (req, res) => {
  try {
    const { owner, command, type } = req.body;

    if (command !== 'my nfts') {
      return res.status(400).json({ error: 'Invalid command' });
    }

    let nfts = [];

    if (type === 'all') {
      nfts = await fetchNFTs(owner);
    } else if (isValidAddress(type)) {
      nfts = await fetchNFTs(owner, [type]);
    } else {
      const contractAddr = getContractAddress(type);
      if (contractAddr) {
        nfts = await fetchNFTs(owner, [contractAddr]);
      } else {
        const all = await fetchNFTs(owner);
        const keyword = type.toLowerCase();
        nfts = all.filter(nft =>
          (nft.name || nft.title || nft.metadata?.name || '').toLowerCase().includes(keyword)
        );
      }
    }

    console.log(`📦 Returning ${nfts.length} NFTs to frontend`);
    return res.json({ nfts });

  } catch (err) {
    console.error('🚨 Error checking NFTs:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
