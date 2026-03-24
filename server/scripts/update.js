#!/usr/bin/env node
/**
 * Update script: git pull, npm install, optional pm2 restart.
 * Run from server/: node scripts/update.js
 * Returns exit 0 on success, writes JSON result to stdout when --json.
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.join(__dirname, '..', '..');
const JSON_OUT = process.argv.includes('--json');

function run(cmd, opts = {}) {
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      cwd: opts.cwd || REPO_ROOT,
      stdio: opts.silent ? 'pipe' : 'inherit',
    });
    return { ok: true, out: result };
  } catch (err) {
    return { ok: false, err: err.message || String(err) };
  }
}

function hasGit() {
  return fs.existsSync(path.join(REPO_ROOT, '.git'));
}

function main() {
  const result = { success: false, steps: [], pm2Restart: false, message: '' };

  if (!hasGit()) {
    result.message = 'Not a git repository — manual update required. Download the latest release.';
    if (JSON_OUT) console.log(JSON.stringify(result));
    process.exit(1);
  }

  const branch = process.env.UPDATE_BRANCH || 'main';

  // 1. git fetch
  const r1 = run(`git fetch origin ${branch}`, { silent: JSON_OUT });
  result.steps.push({ step: 'git fetch', ok: r1.ok });
  if (!r1.ok) {
    result.message = `git fetch failed: ${r1.err}`;
    if (JSON_OUT) console.log(JSON.stringify(result));
    process.exit(1);
  }

  // 2. git reset --hard
  const r2 = run(`git reset --hard origin/${branch}`, { silent: JSON_OUT });
  result.steps.push({ step: 'git reset', ok: r2.ok });
  if (!r2.ok) {
    result.message = `git reset failed: ${r2.err}`;
    if (JSON_OUT) console.log(JSON.stringify(result));
    process.exit(1);
  }

  // 3. npm install
  const r3 = run('npm install', { cwd: SERVER_ROOT, silent: JSON_OUT });
  result.steps.push({ step: 'npm install', ok: r3.ok });
  if (!r3.ok) {
    result.message = `npm install failed: ${r3.err}`;
    if (JSON_OUT) console.log(JSON.stringify(result));
    process.exit(1);
  }

  // 4. Try pm2 restart (optional)
  try {
    spawnSync('pm2', ['restart', 'all'], {
      cwd: SERVER_ROOT,
      stdio: 'pipe',
      shell: true,
    });
    result.pm2Restart = true;
    result.steps.push({ step: 'pm2 restart', ok: true });
  } catch {
    result.steps.push({ step: 'pm2 restart', ok: false, note: 'PM2 not available' });
  }

  result.success = true;
  result.message = result.pm2Restart
    ? 'Update complete. Server restarted via PM2.'
    : 'Update complete. Restart the server manually (e.g. pm2 restart all or npm run dev).';

  if (JSON_OUT) {
    console.log(JSON.stringify(result));
  } else {
    console.log(result.message);
  }
  process.exit(0);
}

main();
