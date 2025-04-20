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

  const sanitized = input.replace(/[^a-zA-Z0-9\s._:-]/g, '') // Prevent special chars

  const agentPath = path.resolve('agent.py') // Absolute path in case Render deploy is nested

  exec(`python3 ${agentPath} ${sanitized}`, { timeout: 5000 }, (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Mon Terminal error:', stderr || err.message)
      return res.json({ success: false, response: `❌ ${stderr || err.message}` })
    }

    const output = stdout.trim()
    if (!output) {
      return res.json({ success: false, response: '❌ No response from agent.py' })
    }

    res.json({ success: true, response: output })
  })
})

export default router
