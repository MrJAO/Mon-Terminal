// index.js
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

dotenv.config()

// 📦 Route handlers
import analyzeRoute from './routes/analyze.js'
import commandRoute from './api/command.js'
import balanceRoute from './routes/balance.js'
import pnlRoute from './api/pnl.js'
import recordStatRoute from './api/record-stat.js'
import achievementsAddressRoute from './api/achievements/address.js'
import achievementsMintRoute from './api/achievements/mint.js'
import router from './api/swap.js'
import tokenReportRoute from './api/token-report.js'
import bestPriceRoute from './api/best-price.js'

const app = express()
const PORT = process.env.PORT || 3001

// 🔐 CORS setup
const allowedOrigins = [
  'https://www.mon-terminal.xyz',
  'http://localhost:5173', // Optional: allow local dev frontend
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use(express.json())

// 🧠 MCP API Routes
app.use('/api/analyze', analyzeRoute)

// Swap routes (quote & build) via Monorail
app.use('/api/swap', router)
console.log('✅ Swap routes mounted at /api/swap')

// Other API routes
app.use('/api/command', commandRoute)
app.use('/api/balance', balanceRoute)
app.use('/api/pnl', pnlRoute)
app.use('/api/record-stat', recordStatRoute)

// Achievements: mint first, then address lookup
app.use('/api/achievements/mint', achievementsMintRoute)
app.use('/api/achievements', achievementsAddressRoute)

app.use('/api/token-report', tokenReportRoute)
app.use('/api/best-price', bestPriceRoute)

// ✅ Root healthcheck
app.get('/', (req, res) => {
  res.send('🧠 Mon Terminal Server is online and ready.')
})

app.listen(PORT, () => {
  console.log(`🚀 Mon Terminal server running at http://localhost:${PORT}`)
})
