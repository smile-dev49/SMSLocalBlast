import { Router } from 'express';
import { requireAdminDb } from '../middleware/requireAdminDb.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const messagesRouter = Router();

messagesRouter.use(requireAdminDb);
messagesRouter.use(requireAuth);

const ALLOWED_STATUS = new Set(['sent', 'delivered', 'failed']);

/** Enqueue one SMS (Excel / API) */
messagesRouter.post('/', async (req, res) => {
  const to_phone = String(req.body?.to_phone || '').trim();
  const body = String(req.body?.body || '');
  const media_url = req.body?.media_url
    ? String(req.body.media_url).trim()
    : null;

  if (!to_phone || !body) {
    return res.status(400).json({ error: 'to_phone and body are required' });
  }

  const { data, error } = await req.sb
    .from('messages')
    .insert({
      user_id: req.user.id,
      to_phone,
      body,
      media_url: media_url || null,
      status: 'pending',
    })
    .select(
      'id, user_id, to_phone, body, media_url, status, created_at'
    )
    .single();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not enqueue message' });
  }

  res.status(201).json({ message: data });
});

/**
 * Mobile gateway: claim next pending row (atomic).
 * Requires RPC claim_next_message — run sql/002_claim_next_message.sql in Supabase.
 */
messagesRouter.post('/claim-next', async (req, res) => {
  const { data, error } = await req.sb.rpc('claim_next_message', {
    p_user_id: req.user.id,
  });

  if (error) {
    console.error(error);
    if (error.message?.includes('claim_next_message')) {
      return res.status(503).json({
        error: 'Database function missing',
        hint: 'Run server/sql/002_claim_next_message.sql in Supabase SQL Editor',
      });
    }
    return res.status(500).json({ error: 'Could not claim message' });
  }

  if (!data) {
    return res.json({ message: null });
  }

  res.json({ message: data });
});

/** Device reports outcome after send attempt */
messagesRouter.patch('/:id/status', async (req, res) => {
  const id = String(req.params.id || '');
  const status = String(req.body?.status || '').toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return res.status(400).json({
      error: `status must be one of: ${[...ALLOWED_STATUS].join(', ')}`,
    });
  }

  const { data, error } = await req.sb
    .from('messages')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .eq('status', 'assigned')
    .select('id, status, to_phone, body, updated_at')
    .maybeSingle();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not update status' });
  }

  if (!data) {
    return res.status(404).json({ error: 'Message not found or not updatable' });
  }

  res.json({ message: data });
});
