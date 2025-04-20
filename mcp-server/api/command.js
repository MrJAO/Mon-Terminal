// api/command.js
import express from 'express'
import { exec } from 'child_process'
import path from 'path'

const router = express.Router()

router.post('/', (req, res) => {
  const input = req.body.input || req.body.command

  if (!input || typeof input !== 'string') {
    return res.status(400).json({ success: false, response: 'Invalid input' })
  }

  const sanitized = input.replace(/[^a-zA-Z0-9\s._:-]/g, '') // 🧼 Prevent special chars

  // Absolute path to ensure agent.py is found in production (Render)
  const agentPath = path.resolve('agent.py')

  exec(`python3 ${agentPath} ${sanitized}`, (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Mon Terminal error:', stderr)
      return res.json({ success: false, response: 'Mon Terminal encountered an error.' })
    }

    res.json({ success: true, response: stdout.trim() })
  })
})

export default router
