import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import termsRouter from './routes/terms.js';
import coursesRouter from './routes/courses.js';
import ingestRouter from './routes/ingest.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/terms', termsRouter);
app.use('/api/v1/courses', coursesRouter);
app.use('/api/v1/ingest', ingestRouter);

app.listen(config.port, () => {
  console.log(`Course ingest server running on port ${config.port}`);
});

export default app;
