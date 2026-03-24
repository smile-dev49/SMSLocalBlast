import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL?.trim() || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
const godSecret = process.env.GOD_VIEW_SECRET?.trim() || '';
const revokeSecret = process.env.REVOKE_SECRET?.trim() || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }
  return createClient(supabaseUrl, supabaseKey);
}

function requireGodAuth(req, res, next) {
  const secret = godSecret || revokeSecret;
  if (!secret) {
    return res.status(503).json({ error: 'God View not configured' });
  }
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

export const godRouter = Router();
godRouter.use(requireGodAuth);

godRouter.get('/stats', async (_req, res) => {
  try {
    const sb = getSupabase();
    const [totalRes, activeRes, revokedRes, activeDomainsRes] = await Promise.all([
      sb.from('licenses').select('*', { count: 'exact', head: true }),
      sb.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      sb.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'revoked'),
      sb
        .from('licenses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .not('activated_domain', 'is', null),
    ]);

    res.json({
      total: totalRes.count ?? 0,
      active: activeRes.count ?? 0,
      revoked: revokedRes.count ?? 0,
      activated: activeDomainsRes.count ?? 0,
    });
  } catch (err) {
    console.error('[god/stats]', err);
    res.status(500).json({ error: err.message || 'Failed to fetch stats' });
  }
});

godRouter.get('/licenses', async (_req, res) => {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('licenses')
      .select('id, purchase_code, buyer_username, activated_domain, status, last_check_in, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[god/licenses]', error);
      return res.status(500).json({ error: 'Failed to fetch licenses' });
    }

    res.json({ licenses: data || [] });
  } catch (err) {
    console.error('[god/licenses]', err);
    res.status(500).json({ error: err.message || 'Failed to fetch licenses' });
  }
});
