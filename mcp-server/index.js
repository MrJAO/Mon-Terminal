// mcp-server/index.js
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

dotenv.config()

// 📦 Route handlers
import analyzeRoute             from './routes/analyze.js'
import commandRoute             from './api/command.js'
import balanceRoute             from './routes/balance.js'
import pnlRoute                 from './api/pnl.js'
import recordStatRoute          from './api/record-stat.js'
import achievementsAddressRoute from './api/achievements/address.js'
import achievementsMintRoute    from './api/achievements/mint.js'
import swapRoute                from './api/swap.js'
import tokenReportRoute         from './api/token-report.js'
import bestPriceRoute           from './api/best-price.js'
import checkNFTRouter           from './routes/checkNFT.js'

// 🆕 Degen (Nad.fun) routes
import degenRouter              from './routes/degen.js'

// 🆕 Monorail swap logic (quote + confirm)
import quoteBuilderRoute        from './routes/quoteBuilder.js'
import swapBuilderRoute         from './routes/swapBuilder.js'

const app  = express()
const PORT = process.env.PORT || 3001

// 🔐 CORS setup
const allowedOrigins = [
  'https://www.mon-terminal.xyz',
  'http://localhost:5173'
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
app.use('/api/analyze',       analyzeRoute)

// Existing Swap routes
app.use('/api/swap',          swapRoute)
console.log('✅ Swap routes mounted at /api/swap')

// 🧪 Monorail tracking routes
app.use('/api/track/quote',   quoteBuilderRoute)
app.use('/api/track/confirm', swapBuilderRoute)
console.log('🧪 Monorail tracking routes mounted at /api/track/...')

// Other API routes
app.use('/api/command',       commandRoute)
app.use('/api/balance',       balanceRoute)
app.use('/api/pnl',           pnlRoute)
app.use('/api/record-stat',   recordStatRoute)

// Achievements: mint first, then address lookup
app.use('/api/achievements/mint', achievementsMintRoute)
app.use('/api/achievements',      achievementsAddressRoute)

// Token reporting & best-price
app.use('/api/token-report',    tokenReportRoute)
app.use('/api/best-price',      bestPriceRoute)

// NFT Functions
app.use('/api/checkNFT',        checkNFTRouter)

// ——— Nad.fun Degen routes — mount at /degen
app.use('/degen', degenRouter)
console.log('🟢 Degen routes mounted at /degen')

// ✅ Root healthcheck
app.get('/', (req, res) => {
  res.send('🧠 Mon Terminal Server is online and ready.')
})

app.listen(PORT, () => {
  console.log(`🚀 Mon Terminal server running at http://localhost:${PORT}`)
})
