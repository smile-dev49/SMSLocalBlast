import { Router } from 'express';
import { env } from '../config/env.js';
import {
  getSupabase,
  getSupabaseAdmin,
  isSupabaseConfigured,
} from '../db/supabase.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  if (!isSupabaseConfigured()) {
    return res.json({
      ok: true,
      service: 'sms-localblast-api',
      version: '0.1.0',
      supabase: 'not_configured',
      hint: 'Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env',
      time: new Date().toISOString(),
    });
  }

  const sb = getSupabase();
  let supabase = 'error';
  let supabaseDetail = undefined;

  try {
    const { error } = await sb.from('users').select('id').limit(1);
    if (!error) {
      supabase = 'ok';
    } else if (
      /permission denied|row-level security|RLS/i.test(error.message || '') ||
      error.code === '42501'
    ) {
      supabase = 'connected_rls_blocked';
      supabaseDetail =
        'Publishable key cannot read users yet — add RLS policies, or set SUPABASE_SERVICE_ROLE_KEY for server-side admin access.';
    } else {
      supabase = 'error';
      supabaseDetail = error.message;
    }
  } catch (e) {
    supabase = 'error';
    supabaseDetail = e?.message || String(e);
  }

  let supabaseAdmin = 'not_configured';
  if (env.supabaseServiceRoleKey) {
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        const { error: e2 } = await admin.from('users').select('id').limit(1);
        supabaseAdmin = e2 ? 'error' : 'ok';
        if (e2 && supabaseAdmin === 'error') {
          supabaseDetail = supabaseDetail || e2.message;
        }
      } catch (e) {
        supabaseAdmin = 'error';
      }
    }
  }

  res.json({
    ok: true,
    service: 'sms-localblast-api',
    version: '0.1.0',
    supabase,
    ...(supabaseDetail ? { supabaseDetail } : {}),
    supabaseAdmin,
    time: new Date().toISOString(),
  });
});
