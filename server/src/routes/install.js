import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../lib/password.js';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INSTALL_FILE = path.join(__dirname, '..', '..', 'config', 'installed.json');
const ENV_FILE = path.join(__dirname, '..', '..', '.env');

function isInstalled() {
  try {
    return fs.existsSync(INSTALL_FILE);
  } catch {
    return false;
  }
}

export const installRouter = Router();

installRouter.get('/status', (_req, res) => {
  res.json({ installed: isInstalled() });
});

installRouter.post('/', async (req, res) => {
  if (isInstalled()) {
    return res.status(403).json({ error: 'Already installed' });
  }

  const supabaseUrl = String(req.body?.supabase_url || '').trim();
  const supabaseServiceKey = String(req.body?.supabase_service_key || '').trim();
  const supabaseAnonKey = String(req.body?.supabase_anon_key || '').trim();
  const siteName = String(req.body?.site_name || 'SMS LocalBlast').trim();
  const supportEmail = String(req.body?.support_email || '').trim();
  const primaryColor = String(req.body?.primary_color || '#1b4d89').trim();
  const adminEmail = String(req.body?.admin_email || '').trim().toLowerCase();
  const adminPassword = String(req.body?.admin_password || '');

  if (!supabaseUrl || !supabaseServiceKey || !adminEmail || !adminPassword) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['supabase_url', 'supabase_service_key', 'admin_email', 'admin_password'],
    });
  }
  if (adminPassword.length < 8) {
    return res.status(400).json({ error: 'Admin password must be at least 8 characters' });
  }

  try {
    const sb = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existing } = await sb.from('users').select('id').eq('email', adminEmail).maybeSingle();
    if (existing) {
      const { error: updateErr } = await sb
        .from('users')
        .update({ role: 'admin', password_hash: await hashPassword(adminPassword), updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (updateErr) throw updateErr;
    } else {
      const password_hash = await hashPassword(adminPassword);
      const { error: insertErr } = await sb.from('users').insert({
        email: adminEmail,
        password_hash,
        role: 'admin',
      });
      if (insertErr) throw insertErr;
    }

    const jwtSecret = crypto.randomBytes(32).toString('hex');
    const config = {
      supabase_url: supabaseUrl,
      supabase_anon_key: supabaseAnonKey || supabaseServiceKey,
      supabase_service_key: supabaseServiceKey,
      site_name: siteName,
      support_email: supportEmail,
      primary_color: primaryColor,
      admin_email: adminEmail,
      jwt_secret: jwtSecret,
      installed_at: new Date().toISOString(),
    };

    const configDir = path.dirname(INSTALL_FILE);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(INSTALL_FILE, JSON.stringify(config, null, 2), 'utf8');

    const envLines = [
      `NODE_ENV=development`,
      `PORT=${process.env.PORT || 3000}`,
      `PUBLIC_ORIGIN=${process.env.PUBLIC_ORIGIN || 'http://localhost:3000'}`,
      `RATE_LIMIT_MSG_PER_HOUR=200`,
      `SUPABASE_URL=${supabaseUrl}`,
      `SUPABASE_PUBLISHABLE_KEY=${supabaseAnonKey || supabaseServiceKey}`,
      `SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}`,
      `JWT_SECRET=${jwtSecret}`,
    ];
    fs.writeFileSync(ENV_FILE, envLines.join('\n') + '\n', 'utf8');

    res.json({
      success: true,
      message: 'Installation complete. Restart the server to apply changes.',
    });
  } catch (err) {
    console.error('[install]', err);
    res.status(500).json({
      error: 'Installation failed',
      detail: err.message || String(err),
    });
  }
});
