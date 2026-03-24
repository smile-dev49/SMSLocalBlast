import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { updateCheckRouter } from './routes/updateCheck.js';
import { readBrandFromFile } from './lib/brand.js';
import { authRouter } from './routes/auth.js';
import { messagesRouter } from './routes/messages.js';
import { devicesRouter } from './routes/devices.js';
import { adminRouter } from './routes/admin.js';
import { installRouter } from './routes/install.js';
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

  const landingPath = path.join(__dirname, '..', '..', 'landing-web');
  app.get('/', (_req, res) => res.sendFile(path.join(landingPath, 'index.html')));
  app.use('/', express.static(landingPath));

  app.use('/api/install', installRouter);
  app.get('/api/brand', (_req, res) => res.json(readBrandFromFile()));
  app.use('/api/update-check', updateCheckRouter);
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/devices', devicesRouter);
  app.use('/api/admin', adminRouter);

  const addinPath = path.join(__dirname, '..', '..', 'excel-addin');
  const adminPath = path.join(__dirname, '..', '..', 'admin-web');
  const iosShortcutPath = path.join(__dirname, '..', '..', 'ios-shortcut');
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
  app.use('/ios-shortcut', express.static(iosShortcutPath));

  const installPath = path.join(__dirname, '..', '..', 'install-web');
  app.get('/install', (_req, res) => res.sendFile(path.join(installPath, 'index.html')));
  app.use('/install', express.static(installPath));

  const demoPath = path.join(__dirname, '..', '..', 'demo-web');
  app.get('/demo', (_req, res) => res.sendFile(path.join(demoPath, 'index.html')));
  app.use('/demo', express.static(demoPath));

  const docsPath = path.join(__dirname, '..', '..', 'docs');
  app.get('/docs', (_req, res) => res.sendFile(path.join(docsPath, 'manual.html')));
  app.use('/docs', express.static(docsPath));

  const legalPath = path.join(__dirname, '..', '..', 'legal');
  app.get('/privacy', (_req, res) => res.sendFile(path.join(legalPath, 'privacy.html')));
  app.get('/terms', (_req, res) => res.sendFile(path.join(legalPath, 'terms.html')));
  app.use('/legal', express.static(legalPath));

  const signupPath = path.join(__dirname, '..', '..', 'signup-web');
  app.get('/signup', (_req, res) => res.sendFile(path.join(signupPath, 'index.html')));
  app.use('/signup', express.static(signupPath));

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.path });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
