import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!env.databaseUrl) {
    return null;
  }
  if (!pool) {
    pool = new Pool({ connectionString: env.databaseUrl });
  }
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  if (!p) {
    throw new Error('DATABASE_URL is not configured');
  }
  return p.query(text, params);
}
