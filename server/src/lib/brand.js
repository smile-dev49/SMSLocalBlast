import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INSTALL_FILE = path.join(__dirname, '..', '..', 'config', 'installed.json');

const DEFAULTS = {
  site_name: 'SMS LocalBlast',
  support_email: '',
  primary_color: '#1b4d89',
};

export function readBrandFromFile() {
  try {
    const raw = fs.readFileSync(INSTALL_FILE, 'utf8');
    const cfg = JSON.parse(raw);
    return {
      site_name: cfg.site_name || DEFAULTS.site_name,
      support_email: cfg.support_email ?? DEFAULTS.support_email,
      primary_color: cfg.primary_color || DEFAULTS.primary_color,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeBrandToFile(brand) {
  try {
    const dir = path.dirname(INSTALL_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let cfg = {};
    if (fs.existsSync(INSTALL_FILE)) {
      cfg = JSON.parse(fs.readFileSync(INSTALL_FILE, 'utf8'));
    }
    if (brand.site_name != null) cfg.site_name = String(brand.site_name).trim() || 'SMS LocalBlast';
    if (brand.support_email != null) cfg.support_email = String(brand.support_email).trim();
    if (brand.primary_color != null) cfg.primary_color = String(brand.primary_color).trim() || '#1b4d89';
    fs.writeFileSync(INSTALL_FILE, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (err) {
    console.error('[brand] write file', err);
  }
}
