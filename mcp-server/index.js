// index.js
import express from 'express'
import dotenv from 'dotenv'

// 🌐 Load environment variables
dotenv.config()

// 📦 Route handlers
import analyzeRoute from './routes/analyze.js'
import commandRoute from './api/command.js'
import balanceRoute from './routes/balance.js'
import pnlRoute from './api/pnl.js'
import recordStat from './api/record-stat.js'
import achievementsAddressRoute from './api/achievements/address.js'
import achievementsMintRoute from './api/achievements/mint.js'

const app = express()
const PORT = process.env.PORT || 3001

// 🔐 Middleware
app.use(express.json())

// 🧠 MCP API Routes
// Analyze route for wallet transaction and NFT stats
app.use('/api/analyze', analyzeRoute)

// Other routes
app.use('/api/command', commandRoute)
app.use('/api/balance', balanceRoute)
app.use('/api/pnl', pnlRoute)
app.use('/api/record-stat', recordStat)
app.use('/api/achievements', achievementsAddressRoute)
app.use('/api/achievements/mint', achievementsMintRoute)

// ✅ Root healthcheck
app.get('/', (req, res) => {
  res.send('🧠 Mon Terminal Server is online and ready.')
})

app.listen(PORT, () => {
  console.log(`🚀 Mon Terminal server running at http://localhost:${PORT}`)
})
