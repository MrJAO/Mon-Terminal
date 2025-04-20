// api/achievements/address.js
import express from 'express'
import { ethers } from 'ethers'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../abi/SimpleAchievementNFT.abi.json'), 'utf8')
)

const router = express.Router()
const CONTRACT_ADDRESS = process.env.ACHIEVEMENT_CONTRACT_ADDRESS
const RPC_URL = process.env.MONAD_RPC_URL

const provider = new ethers.JsonRpcProvider(RPC_URL)
const iface = new ethers.Interface(ABI)

const achievementNames = {
  green10:       "Profit Initiate",
  red10:         "Paperhands",
  green20:       "Bull Rider",
  red20:         "Overtrader",
  green30:       "Momentum Master",
  red30:         "Dip Devotee",
  green40:       "Terminal Trader",
  red40:         "Hopeless Holder",
  green50:       "Ghost of Green",
  red50:         "Ghost of Red",
  green_hidden:  "King of Green Days",
  red_hidden:    "What a Freaking Loser",
}

router.get('/:address', async (req, res) => {
  const user = req.params.address?.toLowerCase()

  if (!user || !ethers.isAddress(user)) {
    return res.status(400).json({ success: false, error: 'Invalid wallet address.' })
  }

  try {
    const topic0 = ethers.id("Minted(address,uint256,string)")

    const logs = await provider.getLogs({
      address: CONTRACT_ADDRESS,
      topics: [topic0]
    })

    const unlockedLabels = logs
      .map(log => iface.parseLog(log).args.label)
      .filter((_, i) => {
        const parsed = iface.parseLog(logs[i])
        return parsed.args.user.toLowerCase() === user
      })

    const result = {}
    for (const [id, label] of Object.entries(achievementNames)) {
      result[id] = unlockedLabels.includes(label)
    }

    return res.json({ success: true, achievements: result })
  } catch (err) {
    console.error('[❌ achievements/address] error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
