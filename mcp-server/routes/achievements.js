// mon-terminal/mcp-server/routes/achievements.js
import express from 'express'
import { ethers } from 'ethers'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../abi/SimpleAchievementNFT.abi.json'), 'utf8')
)

const router = express.Router()

const CONTRACT_ADDRESS = process.env.ACHIEVEMENT_CONTRACT_ADDRESS
const RPC_URL = process.env.MON_RPC_URL

const provider = new ethers.JsonRpcProvider(RPC_URL)
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

// List of all achievement IDs
const ACHIEVEMENT_IDS = [
  'green10','red10','green20','red20','green30','red30',
  'green40','red40','green50','red50','green_hidden','red_hidden'
]

// ✅ Only GET route remains: Check user’s minted achievements
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

export default router
