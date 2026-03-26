import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { readBrandFromFile } from './lib/brand.js';
import { healthRouter } from './routes/health.js';
import { updateCheckRouter } from './routes/updateCheck.js';
import { authRouter } from './routes/auth.js';
import { messagesRouter } from './routes/messages.js';
import { devicesRouter } from './routes/devices.js';
import { adminRouter } from './routes/admin.js';
import { installRouter } from './routes/install.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      // Office add-ins are hosted in an iframe by Office web domains.
      frameguard: false,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          scriptSrc: ["'self'", 'https://appsforoffice.microsoft.com'],
          'frame-ancestors': [
            "'self'",
            'https://*.officeapps.live.com',
            'https://*.office.com',
            'https://*.microsoft.com',
            'https://*.cloud.microsoft',
          ],
        },
      },
    })
  );
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // API routes first
  app.use('/api/install', installRouter);
  app.get('/api/brand', (_req, res) => res.json(readBrandFromFile()));
  app.use('/api/update-check', updateCheckRouter);
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/devices', devicesRouter);
  app.use('/api/admin', adminRouter);

  // Excel add-in (Office.js – kept as static; loads in Excel WebView)
  const addinPath = path.join(__dirname, '..', '..', 'excel-addin');
  const iconPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  app.get('/add-in/assets/icon-32.png', (_req, res) => res.type('image/png').send(iconPng));
  app.get('/add-in/assets/icon-64.png', (_req, res) => res.type('image/png').send(iconPng));
  app.use('/add-in', express.static(addinPath));

  // React SPA (all web pages: landing, demo, signup, install, admin, docs, legal, ios-shortcut)
  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  const frontendExists = fs.existsSync(path.join(frontendPath, 'index.html'));

  if (frontendExists) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    // Fallback to legacy static folders if frontend not built
    const landingPath = path.join(__dirname, '..', '..', 'landing-web');
    const adminPath = path.join(__dirname, '..', '..', 'admin-web');
    const installPath = path.join(__dirname, '..', '..', 'install-web');
    const demoPath = path.join(__dirname, '..', '..', 'demo-web');
    const signupPath = path.join(__dirname, '..', '..', 'signup-web');
    const docsPath = path.join(__dirname, '..', '..', 'docs');
    const legalPath = path.join(__dirname, '..', '..', 'legal');
    const iosShortcutPath = path.join(__dirname, '..', '..', 'ios-shortcut');

    app.get('/', (_req, res) => res.sendFile(path.join(landingPath, 'index.html')));
    app.use('/', express.static(landingPath));
    app.get('/admin', (_req, res) => res.sendFile(path.join(adminPath, 'index.html')));
    app.use('/admin', express.static(adminPath));
    app.get('/install', (_req, res) => res.sendFile(path.join(installPath, 'index.html')));
    app.use('/install', express.static(installPath));
    app.get('/demo', (_req, res) => res.sendFile(path.join(demoPath, 'index.html')));
    app.use('/demo', express.static(demoPath));
    app.get('/signup', (_req, res) => res.sendFile(path.join(signupPath, 'index.html')));
    app.use('/signup', express.static(signupPath));
    app.get('/docs', (_req, res) => res.sendFile(path.join(docsPath, 'manual.html')));
    app.use('/docs', express.static(docsPath));
    app.get('/privacy', (_req, res) => res.sendFile(path.join(legalPath, 'privacy.html')));
    app.get('/terms', (_req, res) => res.sendFile(path.join(legalPath, 'terms.html')));
    app.use('/legal', express.static(legalPath));
    app.get('/ios-shortcut', (_req, res) => res.sendFile(path.join(iosShortcutPath, 'index.html')));
    app.use('/ios-shortcut', express.static(iosShortcutPath));
  }

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.path });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
