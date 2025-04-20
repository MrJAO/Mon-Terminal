// mcp-server/api/achievements/mint.js
import express from 'express'
import { ethers } from 'ethers'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../abi/SimpleAchievementNFT.abi.json'), 'utf8')
)

const router = express.Router()

const CONTRACT_ADDRESS = process.env.ACHIEVEMENT_CONTRACT_ADDRESS
const RPC_URL = process.env.MONAD_RPC_URL

const provider = new ethers.JsonRpcProvider(RPC_URL)
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

router.post('/', async (req, res) => {
  const { address, id, label } = req.body

  if (!address || !id || !label) {
    return res.status(400).json({
      success: false,
      error: 'Missing address, id, or label',
    })
  }

  console.log(`[mint.js] Mint request received → address: ${address}, id: ${id}, label: ${label}`)

  // Inform frontend this is a UI-handled action
  return res.status(400).json({
    success: false,
    error:
      'Minting is now handled on the frontend. Please use your connected wallet to sign the mint transaction.',
  })
})

export default router
