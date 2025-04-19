// api/command.js
import express from 'express'
import { exec } from 'child_process'

const router = express.Router()

router.post('/', (req, res) => {
  // Support both 'input' and 'command' fields for backward compatibility
  const input = req.body.input || req.body.command

  if (!input || typeof input !== 'string') {
    return res.status(400).json({ success: false, response: 'Invalid input' })
  }

  const sanitized = input.replace(/[^a-zA-Z0-9\s._:-]/g, '') // prevent special chars for safety

  // Note: achievements and mint commands are now handled by the front-end
  //       via /api/achievements and /api/achievements/mint endpoints.
  //       Any other commands are forwarded to agent.py.
  exec(`python3 agent.py ${sanitized}`, (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Mon Terminal error:', stderr)
      return res.json({ success: false, response: 'Mon Terminal encountered an error.' })
    }

    // Return the agent's output under 'response' so frontend picks it up
    res.json({ success: true, response: stdout.trim() })
  })
})

export default router
