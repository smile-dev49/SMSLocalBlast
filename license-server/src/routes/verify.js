import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL?.trim() || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  }
  return createClient(supabaseUrl, supabaseKey);
}

export const verifyRouter = Router();

verifyRouter.post('/verify-license', async (req, res) => {
  const purchaseCode = String(req.body?.purchase_code || '').trim();
  const domain = String(req.body?.domain || '').trim().toLowerCase();

  if (!purchaseCode || !domain) {
    return res.status(400).json({
      valid: false,
      reason: 'Missing purchase_code or domain',
    });
  }

  try {
    const sb = getSupabase();
    const { data: license, error } = await sb
      .from('licenses')
      .select('id, purchase_code, activated_domain, status')
      .eq('purchase_code', purchaseCode)
      .maybeSingle();

    if (error) {
      console.error('[verify-license]', error);
      return res.status(500).json({
        valid: false,
        reason: 'License check failed',
      });
    }

    if (!license) {
      return res.json({
        valid: false,
        reason: 'Invalid purchase code',
      });
    }

    if (license.status !== 'active') {
      return res.json({
        valid: false,
        reason: `License is ${license.status}`,
      });
    }

    if (license.activated_domain && license.activated_domain !== domain) {
      return res.json({
        valid: false,
        reason: 'License already activated on a different domain',
      });
    }

    const now = new Date().toISOString();
    const updates = {
      last_check_in: now,
      updated_at: now,
    };

    if (!license.activated_domain) {
      updates.activated_domain = domain;
    }

    const { error: updateErr } = await sb
      .from('licenses')
      .update(updates)
      .eq('id', license.id);

    if (updateErr) {
      console.error('[verify-license] update', updateErr);
    }

    res.json({
      valid: true,
      domain: license.activated_domain || domain,
    });
  } catch (err) {
    console.error('[verify-license]', err);
    res.status(500).json({
      valid: false,
      reason: err.message || 'Verification failed',
    });
  }
});

verifyRouter.post('/revoke-license', async (req, res) => {
  const secret = process.env.REVOKE_SECRET?.trim();
  if (!secret) {
    return res.status(503).json({ error: 'Revoke not configured' });
  }
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const purchaseCode = String(req.body?.purchase_code || '').trim();
  if (!purchaseCode) {
    return res.status(400).json({ error: 'Missing purchase_code' });
  }

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('licenses')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('purchase_code', purchaseCode)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[revoke-license]', error);
      return res.status(500).json({ error: 'Revoke failed' });
    }

    if (!data) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json({ success: true, message: 'License revoked' });
  } catch (err) {
    console.error('[revoke-license]', err);
    res.status(500).json({ error: err.message || 'Revoke failed' });
  }
});
