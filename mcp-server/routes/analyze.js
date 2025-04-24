import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';
import { tokenContracts } from '../helpers/analyzeContracts.js';

dotenv.config();

const router = express.Router();
router.use(cors());
router.use(express.json());

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const TRANSFERS_URL   = `https://monad-testnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const NFT_URL         = `https://monad-testnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

// —————————— NFT GROUP DEFINITIONS ——————————
const nftGroups = {
  "Guaranteed Mainnet Mint": [
    { name: "Lil Chogstars Mint Pass",           address: "0x26c86f2835c114571df2b6ce9ba52296cc0fa6bb", threshold: 1 },
    { name: "Molandak Mint Pass",                 address: "0x6341c537a6fc563029d8e8caa87da37f227358f4", threshold: 1 },
    { name: "Overnads Whitelist Pass",            address: "0x49d54cd9ca8c5ecadbb346dc6b4e31549f34e405", threshold: 1 },
    { name: "Mecha Box Mint Pass",                address: "0x88bbcba96a52f310497774e7fd5ebadf0ece21fb", threshold: 1 },
    { name: "Meowwnads",                          address: "0xa568cabe34c8ca0d2a8671009ae0f6486a314425", threshold: 3 },
    { name: "Mutated Monadsters",                 address: "0x7ea266cf2db3422298e28b1c73ca19475b0ad345", threshold: 1 },
    { name: "DRIPSTER DISC PASS",                 address: "0x6c84c9d9e06002776b3cd87f54f915b5ae2be439", threshold: 1 },
    { name: "Sealuminati Testnetooor",            address: "0x4870e911b1986c6822a171cdf91806c3d44ce235", threshold: 10 }
  ],

  "Featured Testnet NFTs": [],

  "Breath of Estova": [
    { name: "Legacy Egg",                         address: "0xa980f072bc06d67faec2b03a8ada0d6c9d0da9f8", threshold: 1 },
    { name: "Mystery Token",                      address: "0xff59f1e14c4f5522158a0cf029f94475ba469458", threshold: 1 }
  ],
  "Chewy": [
    { name: "Mecha Box Mint Pass",                address: "0x88bbcba96a52f310497774e7fd5ebadf0ece21fb", threshold: 1 },
    { name: "Chewy",                              address: "0x88bbcba96a52f310497774e7fd5ebadf0ece21fb", threshold: 1 }
  ],
  "Chog NFT": [
    { name: "Chogs Mystery Chest",                address: "0xe6b5427b174344fd5cb1e3d5550306b0055473c6", threshold: 1 }
  ],
  "Chogstars": [
    { name: "Lil Chogstars Mint Pass",            address: "0x26c86f2835c114571df2b6ce9ba52296cc0fa6bb", threshold: 1 }
  ],
  "Meowwnads": [
    { name: "Meowwnads",                          address: "0xa568cabe34c8ca0d2a8671009ae0f6486a314425", threshold: 3 }
  ],
  "Monad Nomads": [
    { name: "Monad Nomads",                      address: "0x9ac5998884cf59d8a87dfc157560c1f0e1672e04", threshold: 1 }
  ],
  "Monadverse": [
    { name: "Chapter 1",                          address: "0xe25c57ff3eea05d0f8be9aaae3f522ddc803ca4e", threshold: 1 },
    { name: "Chapter 2",                          address: "0x3a9acc3be6e9678fa5d23810488c37a3192aaf75", threshold: 1 },
    { name: "Chapter 3",                          address: "0xcab08943346761701ec9757befe79ea88dd67670", threshold: 1 },
    { name: "Chapter 4",                          address: "0xba838e4cca4b852e1aebd32f248967ad98c3aa45", threshold: 1 },
    { name: "Chapter 5",                          address: "0x5d2a7412872f9dc5371d0cb54274fdb241171b95", threshold: 1 },
    { name: "Chapter 6",                          address: "0x813fa68dd98f1e152f956ba004eb2413fcfa7a7d", threshold: 1 },
    { name: "Chapter 7",                          address: "0xc29b98dca561295bd18ac269d3d9ffdfcc8ad426", threshold: 1 }
  ],
  "Monshape Club": [
    { name: "Monshape Hopium",                   address: "0x69f2688abe5dcde0e2413f77b80efcc16361a56e", threshold: 1 },
    { name: "Monshape x Fantasy WL Pass",        address: "0x977b9b652dcd87e5fbdb849b12ab63a6bb01ac05", threshold: 1 }
  ],
  "Overnads": [
    { name: "Overnads Open Edition",             address: "0x66b655de495268eb4c7b70bf4ac1ab4094589f93", threshold: 1 },
    { name: "Overnads Whitelist Pass",           address: "0x49d54cd9ca8c5ecadbb346dc6b4e31549f34e405", threshold: 1 }
  ],
  "Skrumpeys": [
    { name: "Skrumpeys",                         address: "0xe8f0635591190fb626f9d13c49b60626561ed145", threshold: 1 }
  ],
  "SLMND": [
    { name: "SLMND Genesis",                     address: "0xf7b984c089534ff656097e8c6838b04c5652c947", threshold: 1 }
  ],
  "SpikyNads": [
    { name: "Spike it Up (Open Edition)",        address: "0x9e4339d4d36bac6747e4e42e85e39cd1e2c58a1f", threshold: 1 },
    { name: "Spikes",                            address: "0x87e1f1824c9356733a25d6bed6b9c87a3b31e107", threshold: 1 },
    { name: "SpiKeys",                           address: "0xbb406139138401f4475ca5cf2d7152847159eb7a", threshold: 1 }
  ],
  "The 10k Squad": [
    { name: "The 10k Squad",                     address: "0x3a9454c1b4c84d1861bb1209a647c834d137b442", threshold: 1 }
  ],
  "The Daks": [
    { name: "The Daks",                          address: "0x78ed9a576519024357ab06d9834266a04c9634b7", threshold: 1 }
  ],
  "Wonad": [
    { name: "Genesis Planter Card",              address: "0x9a452f1ae5c1927259dacfa3fd58ede9679c61d0", threshold: 1 },
    { name: "Wonad Soil Card",                   address: "0x33cafd437816eb5aafe2b2e7bedf82a3d8d226e7", threshold: 1 },
    { name: "Wonad Seed Card",                   address: "0x6b5bf2a49d18d2d7f628415060bd1ec11464595d", threshold: 1 },
    { name: "Wonad Shover Card",                 address: "0x5af1e57d7d1c8a83d5dd244de71227caa2d69b31", threshold: 1 },
    { name: "Wonad Water Card",                  address: "0x2577a6bf5ea12b5e2b53bc7bd3fc93a529434d11", threshold: 1 },
    { name: "Wonad Sun Card",                    address: "0x2eFe558C1b4636144D32127E9C12E36508350a02", threshold: 1 }
  ],
  "BlockNads": [
    { name: "BlockNads",                         address: "0x6ed438b2a8eff227e7e54b5324926941b140eea0", threshold: 1 }
  ],
  "Le Mouch": [
    { name: "Le Mouch",                          address: "0x800f8cacc990dda9f4b3f1386c84983ffb65ce94", threshold: 1 }
  ],
  "Mongang": [
    { name: "Mongang",                           address: "0x209fb14943e9412354e982c4784bf89df760bf8f", threshold: 1 }
  ]
};

// —————————— HELPERS ——————————

function isValidAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

// generic paginated transfer fetcher
async function fetchAllTransfers(params) {
  const transfers = [];
  let pageKey, tries = 0;

  do {
    const rpcParams = { ...params, ...(pageKey ? { pageKey } : {}) };
    const resp = await fetch(TRANSFERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [rpcParams]
      })
    });
    if (!resp.ok) throw new Error(`Alchemy error ${resp.status}`);
    const json = await resp.json();
    transfers.push(...(json.result.transfers || []));
    pageKey = json.result.pageKey;
    tries++;
  } while (pageKey && tries < 10);

  return transfers;
}

// exact total transaction count via JSON-RPC
async function getTransactionCount(address) {
  return await provider.getTransactionCount(address);
}

// count interactions with a specific ERC20 token
async function getTokenInteractionCount(owner, tokenAddr) {
  const transfers = await fetchAllTransfers({
    contractAddresses: [tokenAddr],
    category:          ['erc20'],
    withMetadata:      false,
    maxCount:          '0x3e8',
    toAddress:         owner,
    fromAddress:       owner
  });
  return transfers.length;
}

// gather token stats as an array of { symbol, address, count }
async function getAllTokenStats(address) {
  return await Promise.all(
    tokenContracts.map(async ({ symbol, address: tokenAddr }) => {
      const count = await getTokenInteractionCount(address, tokenAddr);
      return { symbol, address: tokenAddr, count };
    })
  );
}

// fetch all NFTs for an owner, as before
async function getNFTs(owner) {
  const all = [];
  let pageKey, tries = 0;

  do {
    const url = new URL(`${NFT_URL}/getNFTsForOwner`);
    url.searchParams.set('owner', owner);
    url.searchParams.set('pageSize', '100');
    if (pageKey) url.searchParams.set('pageKey', pageKey);

    const resp = await fetch(url.toString());
    if (!resp.ok) throw new Error(`NFT API ${resp.status}`);
    const json = await resp.json();
    all.push(...(json.ownedNfts || []));
    pageKey = json.pageKey;
    tries++;
  } while (pageKey && tries < 10);

  return all;
}

// —————————— ROUTES ——————————

// 1️⃣ Total Transactions
router.post('/tx-count', async (req, res) => {
  const { address } = req.body;
  if (!isValidAddress(address)) {
    return res.status(400).json({ success: false, message: 'Invalid address' });
  }
  try {
    const totalTxCount = await getTransactionCount(address.toLowerCase());
    return res.json({ success: true, totalTxCount });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// 2️⃣ Token Contract Interactions
router.post('/token-stats', async (req, res) => {
  const { address } = req.body;
  if (!isValidAddress(address)) {
    return res.status(400).json({ success: false, message: 'Invalid address' });
  }
  try {
    const tokenStats = await getAllTokenStats(address.toLowerCase());
    return res.json({ success: true, tokenStats });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// 3️⃣ NFT Holdings (unchanged)
router.post('/nft-holdings', async (req, res) => {
  const { address } = req.body;
  if (!isValidAddress(address)) {
    return res.status(400).json({ success: false, message: 'Invalid address' });
  }

  try {
    const allNfts = await getNFTs(address.toLowerCase());
    let totalNFTCount = 0;

    const groupHoldings = Object.entries(nftGroups).map(([groupName, items]) => {
      const processed = items.map(({ name, address: addr, threshold }) => {
        const count = allNfts.filter(n =>
          n.contract?.address?.toLowerCase() === addr.toLowerCase()
        ).length;
        totalNFTCount += count;
        const status = count >= threshold
          ? 'Confirm'
          : count > 0
            ? 'Incomplete'
            : 'Not Holding';
        return { name, count, status };
      });
      return { groupName, items: processed };
    });

    return res.json({
      success: true,
      data: { totalNFTCount, groupHoldings }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

export default router;