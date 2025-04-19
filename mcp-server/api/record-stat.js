import express from 'express'
import { ethers } from 'ethers'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load ABI
const ABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../abi/MonTerminal.abi.json'), 'utf8')
)

const router = express.Router()

const CONTRACT_ADDRESS = process.env.MON_TERMINAL_ADDRESS
const RPC_URL = process.env.MONAD_RPC_URL

// Initialize provider and contract instance
const provider = new ethers.JsonRpcProvider(RPC_URL)
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

// Cooldown window in milliseconds
const COOLDOWN_MS = 24 * 60 * 60 * 1000

router.post('/', async (req, res) => {
  const { address, pnl } = req.body

  if (!address || pnl === undefined) {
    return res.status(400).json({ success: false, error: 'Missing address or pnl' })
  }

  try {
    console.log(`[record-stat] Attempting to record stat for address: ${address}, PnL: ${pnl}`)

    // Scale PnL to 6 decimals
    const scaledPnL = BigInt(Math.round(pnl * 1e6))
    console.log(`[record-stat] Scaled PnL: ${scaledPnL}`)

    // === Cooldown enforcement via contract getter ===
    const lastTsRaw = await contract.lastRecord(address)
    const lastTsMs = Number(lastTsRaw) * 1000
    const now = Date.now()
    if (now < lastTsMs + COOLDOWN_MS) {
      console.log('[record-stat] Cooldown still active')
      return res
        .status(400)
        .json({ success: false, error: 'You can only record your stats once every 24 hours.' })
    }

    console.log('[record-stat] Cooldown passed, calling recordStat...')
    const tx = await contract.recordStat(scaledPnL)
    console.log(`[record-stat] Transaction sent: ${tx.hash}`)

    await tx.wait()
    console.log(`[record-stat] Transaction confirmed: ${tx.hash}`)

    return res.json({ success: true, hash: tx.hash })
  } catch (err) {
    console.error('[record-stat error]', err)
    const msg = err.reason || err.message || 'Unknown error'
    if (msg.includes('Cooldown active')) {
      return res
        .status(400)
        .json({ success: false, error: 'You can only record your stats once every 24 hours.' })
    }
    return res.status(500).json({ success: false, error: msg })
  }
})

export default router
