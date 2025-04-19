// mon-terminal/mcp-server/routes/achievements.js
import express from 'express'
import { ethers } from 'ethers'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load ABI for Achievement NFT
const ABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../abi/SimpleAchievementNFT.abi.json'), 'utf8')
)

const router = express.Router()

const CONTRACT_ADDRESS = process.env.ACHIEVEMENT_CONTRACT_ADDRESS
const RPC_URL = process.env.MONAD_RPC_URL
const PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY  // needed for minting

// Initialize provider, wallet, and contract
const provider = new ethers.JsonRpcProvider(RPC_URL)
const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet)

// List of all achievement IDs
const ACHIEVEMENT_IDS = [
  'green10','red10','green20','red20','green30','red30',
  'green40','red40','green50','red50','green_hidden','red_hidden'
]

// GET user's achievements
router.get('/:address', async (req, res) => {
  const { address } = req.params
  try {
    const unlocked = {}
    for (const id of ACHIEVEMENT_IDS) {
      const owned = await contract.minted(address, id)
      if (owned) unlocked[id] = true
    }
    res.json({ success: true, achievements: unlocked })
  } catch (err) {
    console.error('[achievements GET error]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST mint a new achievement
router.post('/mint', async (req, res) => {
  const { address, id, label } = req.body
  if (!address || !id || !label) {
    return res.status(400).json({ success: false, error: 'Missing address, id, or label' })
  }
  try {
    const tx = await contract.mint(address, id, label)
    await tx.wait()
    res.json({ success: true, hash: tx.hash })
  } catch (err) {
    console.error('[achievements MINT error]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
