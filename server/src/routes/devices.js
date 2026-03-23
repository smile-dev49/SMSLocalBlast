import { Router } from 'express';
import { requireAdminDb } from '../middleware/requireAdminDb.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const devicesRouter = Router();

devicesRouter.use(requireAdminDb);
devicesRouter.use(requireAuth);

/** Register or update a device. Pass device_id to refresh last_seen for existing device. */
devicesRouter.post('/', async (req, res) => {
  const deviceId = req.body?.device_id ? String(req.body.device_id).trim() : null;
  const name = req.body?.name ? String(req.body.name).trim() : null;
  const platform = String(req.body?.platform || 'android').trim().toLowerCase();

  const now = new Date().toISOString();

  if (deviceId) {
    const { data, error } = await req.sb
      .from('devices')
      .update({ last_seen_at: now })
      .eq('id', deviceId)
      .eq('user_id', req.user.id)
      .select('id, name, platform, last_seen_at')
      .maybeSingle();

    if (!error && data) {
      return res.json({ device: data });
    }
  }

  const { data, error } = await req.sb
    .from('devices')
    .insert({
      user_id: req.user.id,
      name: name || `Device ${now.slice(0, 10)}`,
      platform: platform || 'android',
      last_seen_at: now,
    })
    .select('id, name, platform, last_seen_at')
    .single();

  if (error) {
    console.error('[devices]', error);
    return res.status(500).json({ error: 'Could not register device' });
  }

  res.status(201).json({ device: data });
});
