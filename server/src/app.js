import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: [env.publicOrigin, /^https:\/\/localhost:\d+$/],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));

  app.get('/', (_req, res) => {
    res.json({
      name: 'SMS LocalBlast API',
      docs: '/api/health',
    });
  });

  app.use('/api/health', healthRouter);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.path });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
