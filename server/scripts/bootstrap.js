#!/usr/bin/env node
/**
 * Bootstrap script for SMS LocalBlast initial setup.
 * Run from server/: node scripts/bootstrap.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.join(__dirname, '..', '..');
const ENV_EXAMPLE = path.join(SERVER_ROOT, '.env.example');
const ENV_FILE = path.join(SERVER_ROOT, '.env');

function log(msg) {
  console.log(msg);
}

function checkNode() {
  const v = process.version;
  const major = parseInt(v.slice(1).split('.')[0], 10);
  if (major < 18) {
    log(`✗ Node.js 18+ required (you have ${v}). Install from https://nodejs.org`);
    process.exit(1);
  }
  log(`✓ Node.js ${v}`);
}

function runNpmInstall() {
  log('Running npm install…');
  execSync('npm install', { cwd: SERVER_ROOT, stdio: 'inherit' });
  log('✓ Dependencies installed');
}

function ensureEnv() {
  if (fs.existsSync(ENV_FILE)) {
    log('✓ .env exists');
    return;
  }
  if (fs.existsSync(ENV_EXAMPLE)) {
    fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
    log('✓ Created .env from .env.example — edit with your Supabase keys');
  } else {
    log('! No .env.example found — create .env with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET');
  }
}

function printNextSteps() {
  log('');
  log('Next steps:');
  log('1. Create a Supabase project at https://supabase.com');
  log('2. Run sql/001_initial.sql and sql/002_claim_next_message.sql in Supabase SQL Editor');
  log('3. Edit server/.env with your Supabase URL and keys');
  log('4. Visit http://localhost:3000/install for the web setup wizard');
  log('   OR run: cd server && npm run dev');
  log('');
}

function main() {
  log('SMS LocalBlast — Bootstrap');
  log('—'.repeat(40));
  checkNode();
  runNpmInstall();
  ensureEnv();
  printNextSteps();
}

main();
