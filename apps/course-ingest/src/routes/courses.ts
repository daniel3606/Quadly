import { Router } from 'express';
import { searchCourses, getCourseSections } from '../services/course-service.js';

const router = Router();

// GET /api/v1/courses/search?q=eecs+281&term=FA2025
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query parameter "q" is required (min 2 chars)' });
    }

    const term = req.query.term as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const results = await searchCourses(q, term, limit);
    res.json({ results });
  } catch (err) {
    console.error('Error searching courses:', err);
    res.status(500).json({ error: 'Failed to search courses' });
  }
});

// GET /api/v1/courses/:subject/:catalog/sections?term=FA2025
router.get('/:subject/:catalog/sections', async (req, res) => {
  try {
    const { subject, catalog } = req.params;
    const term = req.query.term as string;

    if (!term) {
      return res.status(400).json({ error: 'Query parameter "term" is required' });
    }

    const result = await getCourseSections(subject, catalog, term);
    if (!result) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching sections:', err);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

export default router;
