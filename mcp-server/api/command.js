// api/command.js
import express from 'express'
import { exec } from 'child_process'
import path from 'path'

const router = express.Router()

// Execute CLI agent commands via Python
router.post('/', (req, res) => {
  const input = req.body.input || req.body.command

  if (!input || typeof input !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid input' })
  }

  // Prevent shell injection by stripping dangerous characters
  const sanitized = input.replace(/[^a-zA-Z0-9\s._:-]/g, '')
  const agentPath = path.resolve('agent.py')

  exec(
    `python3 ${agentPath} ${sanitized}`,
    { timeout: 5000, shell: true },
    (err, stdout, stderr) => {
      if (err) {
        console.error('❌ Mon Terminal error:', stderr || err.message)
        return res.json({ success: false, error: stderr || err.message })
      }

      const output = stdout.trim()
      if (!output) {
        return res.json({ success: false, error: 'No response from agent.py' })
      }

      // Return CLI output under "data" for consistency
      return res.json({ success: true, data: output })
    }
  )
})

export default router
