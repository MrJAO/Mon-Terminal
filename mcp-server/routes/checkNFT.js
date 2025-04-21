// checkNFT.js
// Express route to check a user's NFT holdings using Alchemy NFT API

import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { getContractAddress } from './NFTContracts.js';

dotenv.config();

const router = express.Router();
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_BASE_URL = `https://monad-testnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

/**
 * Fetch NFTs for a given owner and optional list of contract addresses.
 * @param {string} owner - Wallet address of the owner.
 * @param {Array<string>} contractAddresses - Array of NFT contract addresses.
 * @returns {Promise<Array>} List of owned NFTs.
 */
async function fetchNFTs(owner, contractAddresses = []) {
  const url = new URL(`${ALCHEMY_BASE_URL}/getNFTsForOwner`);
  url.searchParams.set('owner', owner);
  contractAddresses.forEach(addr => url.searchParams.append('contractAddresses[]', addr));
  url.searchParams.set('withMetadata', 'true');
  url.searchParams.set('pageSize', '100');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Alchemy API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.ownedNfts || data.ownedNFTs || [];
}

// Endpoint: POST /api/checkNFT
// Expected body: { owner: '0x...', command: 'my nfts', type: 'all' | '<NFT name or contractAddress>' }
router.post('/', async (req, res) => {
  try {
    const { owner, command, type } = req.body;
    if (command !== 'my nfts') {
      return res.status(400).json({ error: 'Invalid command' });
    }

    let nfts;
    if (type === 'all') {
      // Fetch all NFTs
      nfts = await fetchNFTs(owner);
    } else {
      // Resolve NFT identifier (name or address) to contract address
      const contractAddr = getContractAddress(type);
      if (!contractAddr) {
        return res.status(400).json({ error: `Unknown NFT identifier: ${type}` });
      }
      nfts = await fetchNFTs(owner, [contractAddr]);
    }

    return res.json({ nfts });
  } catch (err) {
    console.error('Error checking NFTs:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
