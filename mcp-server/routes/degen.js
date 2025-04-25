// mcp-server/routes/degen.js
import express from 'express';
import { fetchTokenMarket } from '../services/degenService.js';
const router = express.Router();

router.get('/quote/:token', async (req, res) => {
  try {
    const data = await fetchTokenMarket(req.params.token);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
