import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL?.trim() || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
const releaseSecret =
  process.env.RELEASE_SECRET?.trim() ||
  process.env.MASTER_SERVER_SECRET?.trim() ||
  '';

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }
  return createClient(supabaseUrl, supabaseKey);
}

export const releaseRouter = Router();

releaseRouter.get('/version', async (_req, res) => {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('global_settings')
      .select('key, value')
      .in('key', ['latest_version', 'release_notes']);

    if (error) throw error;

    const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
    res.json({
      latest_version: map.latest_version || '0.0.0',
      release_notes: map.release_notes || '',
    });
  } catch (err) {
    console.error('[version]', err);
    res.status(500).json({
      latest_version: '0.0.0',
      release_notes: '',
    });
  }
});

releaseRouter.post('/release-new-version', async (req, res) => {
  const auth = req.headers.authorization;
  if (!releaseSecret || auth !== `Bearer ${releaseSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const version = String(req.body?.version || '').trim();
  const notes = String(req.body?.notes || '').trim();
  const timestamp = String(req.body?.timestamp || new Date().toISOString()).trim();

  if (!version) {
    return res.status(400).json({ error: 'version required' });
  }

  try {
    const sb = getSupabase();
    const now = new Date().toISOString();

    await sb.from('global_settings').upsert(
      [
        { key: 'latest_version', value: version, updated_at: now },
        { key: 'release_notes', value: notes || `Release ${version}`, updated_at: now },
        { key: 'last_release_at', value: timestamp, updated_at: now },
      ],
      { onConflict: 'key' }
    );

    res.json({
      success: true,
      version,
      message: 'Release notified',
    });
  } catch (err) {
    console.error('[release-new-version]', err);
    res.status(500).json({ error: err.message || 'Failed to save release' });
  }
});
