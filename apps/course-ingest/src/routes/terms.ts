import { Router } from 'express';
import { getTerms } from '../services/course-service.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const terms = await getTerms();
    res.json({ terms });
  } catch (err) {
    console.error('Error fetching terms:', err);
    res.status(500).json({ error: 'Failed to fetch terms' });
  }
});

export default router;
