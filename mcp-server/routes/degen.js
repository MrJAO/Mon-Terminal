// mcp-server/routes/degen.js
import express from 'express';
import { getQuote, confirmSwap } from '../services/degenService.js';

const router = express.Router();

// GET  /api/degen/quote/:contractAddress
router.get('/quote/:contractAddress', async (req, res) => {
  try {
    const quote = await getQuote(req.params.contractAddress);
    res.json(quote);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/degen/swap
router.post('/swap', async (req, res) => {
  try {
    const result = await confirmSwap(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
