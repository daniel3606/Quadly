import { Router } from 'express';
import { config } from '../config.js';
import { runIngestion } from '../services/ingest-orchestrator.js';

const router = Router();

// POST /api/v1/ingest/trigger
// Body: { "term_code": "FA2025" }
// Header: x-api-key: <INGEST_API_KEY>
router.post('/trigger', async (req, res) => {
  try {
    // API key auth
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== config.ingestApiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const { term_code } = req.body;
    if (!term_code || typeof term_code !== 'string') {
      return res.status(400).json({ error: 'term_code is required' });
    }

    // Validate term code format (2-letter season + 4-digit year)
    if (!/^(FA|WN|SP|SU)\d{4}$/.test(term_code)) {
      return res.status(400).json({ error: 'Invalid term_code format. Expected: FA2025, WN2025, SU2025, etc.' });
    }

    const result = await runIngestion(term_code);
    res.json({ success: true, result });
  } catch (err) {
    console.error('Ingestion error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Ingestion failed', message });
  }
});

export default router;
