import { Router } from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getCurrentVersion() {
  try {
    const pkg = JSON.parse(
      readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')
    );
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function isNewer(latest, current) {
  const toParts = (v) =>
    v.split('.').map((n) => parseInt(n, 10) || 0);
  const l = toParts(latest);
  const c = toParts(current);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const a = l[i] || 0;
    const b = c[i] || 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

export const updateCheckRouter = Router();

updateCheckRouter.get('/', async (_req, res) => {
  const licenseUrl = process.env.LICENSE_SERVER_URL?.trim();
  const current = getCurrentVersion();

  if (!licenseUrl) {
    return res.json({
      current_version: current,
      latest_version: current,
      update_available: false,
      release_notes: '',
    });
  }

  try {
    const url = licenseUrl.replace(/\/$/, '') + '/api/v1/version';
    const r = await fetch(url);
    const data = await r.json().catch(() => ({}));
    const latest = data.latest_version || current;
    const updateAvailable = isNewer(latest, current);

    res.json({
      current_version: current,
      latest_version: latest,
      update_available: updateAvailable,
      release_notes: updateAvailable ? (data.release_notes || '') : '',
    });
  } catch {
    res.json({
      current_version: current,
      latest_version: current,
      update_available: false,
      release_notes: '',
    });
  }
});
