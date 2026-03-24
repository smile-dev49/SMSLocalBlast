#!/usr/bin/env node
/**
 * Creates a CodeCanyon-ready zip: source code, web installer, admin, Android source,
 * iOS Shortcut configs, docs. Excludes .env, node_modules, .git, secrets.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist');
const ZIP_NAME = 'sms-localblast-codecanyon.zip';

const EXCLUDE = [
  'node_modules',
  '.git',
  '.env',
  '.env.*',
  '!.env.example',
  'config/installed.json',
  '*.log',
  'dist',
  '.DS_Store',
  'Thumbs.db',
  '.idea',
  '.vscode',
  '*.pem',
  'package-lock.json', // include for reference; remove if preferred
];

function shouldExclude(relPath) {
  const parts = relPath.split(path.sep);
  if (parts.includes('node_modules')) return true;
  if (parts.includes('.git')) return true;
  if (relPath.endsWith('.env') || (relPath.includes('.env.') && !relPath.endsWith('.env.example'))) return true;
  if (relPath === 'config/installed.json') return true;
  if (parts[0] === 'dist') return true;
  if (relPath.endsWith('.log')) return true;
  if (parts.includes('.DS_Store') || parts.includes('Thumbs.db')) return true;
  if (parts.includes('.idea') || parts.includes('.vscode')) return true;
  if (relPath.endsWith('.pem')) return true;
  return false;
}

function walk(dir, base = '', files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (shouldExclude(rel)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, rel, files);
    } else {
      files.push({ full, rel });
    }
  }
  return files;
}

async function main() {
  console.log('Creating CodeCanyon package...');
  const { default: arch } = await import('archiver');

  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const zipPath = path.join(OUT, ZIP_NAME);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  const out = fs.createWriteStream(zipPath);
  const archive = arch('zip', { zlib: { level: 9 } });

  archive.pipe(out);

  const files = walk(ROOT).filter((f) => !path.relative(ROOT, f.full).startsWith('dist' + path.sep));
  const prefix = 'sms-localblast';
  for (const { full, rel } of files) {
    const name = (prefix + '/' + rel).replace(/\\/g, '/');
    archive.file(full, { name });
  }

  archive.finalize();

  await new Promise((res, rej) => {
    out.on('close', res);
    archive.on('error', rej);
  });

  const stat = fs.statSync(zipPath);
  console.log(`Created ${zipPath} (${(stat.size / 1024).toFixed(1)} KB)`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Build Android APK: cd android && ./gradlew assembleRelease');
  console.log('2. Add app/build/outputs/apk/release/*.apk to the zip if needed');
  console.log('3. Create 16:9 banner (e.g. 590x300 px) for CodeCanyon listing');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
