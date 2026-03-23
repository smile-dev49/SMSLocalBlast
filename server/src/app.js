import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { messagesRouter } from './routes/messages.js';
import { adminRouter } from './routes/admin.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  app.get('/', (_req, res) => {
    res.json({
      name: 'SMS LocalBlast API',
      docs: '/api/health',
      auth: '/api/auth/register | /api/auth/login',
      messages: '/api/messages (Bearer token)',
    });
  });

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/admin', adminRouter);

  const addinPath = path.join(__dirname, '..', '..', 'excel-addin');
  const adminPath = path.join(__dirname, '..', '..', 'admin-web');
  const iconPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  app.get('/add-in/assets/icon-32.png', (_req, res) => {
    res.type('image/png').send(iconPng);
  });
  app.get('/add-in/assets/icon-64.png', (_req, res) => {
    res.type('image/png').send(iconPng);
  });
  app.use('/add-in', express.static(addinPath));
  app.use('/admin', express.static(adminPath));

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.path });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
