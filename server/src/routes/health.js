import { Router } from 'express';
import { getPool } from '../db/pool.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const pool = getPool();
  let db = 'skipped';
  if (pool) {
    try {
      await pool.query('SELECT 1');
      db = 'ok';
    } catch (e) {
      db = 'error';
    }
  } else {
    db = 'not_configured';
  }

  res.json({
    ok: true,
    service: 'sms-localblast-api',
    version: '0.1.0',
    database: db,
    time: new Date().toISOString(),
  });
});
