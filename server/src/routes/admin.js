import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAdminDb } from '../middleware/requireAdminDb.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { generateApiKey } from '../lib/apiKey.js';
import { readBrandFromFile, writeBrandToFile } from '../lib/brand.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPDATE_SCRIPT = path.join(__dirname, '..', 'scripts', 'update.js');

export const adminRouter = Router();

adminRouter.use(requireAdminDb);
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

adminRouter.get('/users', async (req, res) => {
  const { data, error } = await req.sb
    .from('users')
    .select('id, email, role, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/users]', error);
    return res.status(500).json({ error: 'Could not fetch users' });
  }

  res.json({ users: data });
});

adminRouter.get('/stats', async (req, res) => {
  try {
    const sb = req.sb;
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const [
      usersRes,
      totalRes,
      pendingRes,
      sentRes,
      deliveredRes,
      failedRes,
      activeDevicesRes,
    ] = await Promise.all([
      sb.from('users').select('*', { count: 'exact', head: true }),
      sb.from('messages').select('*', { count: 'exact', head: true }),
      sb.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      sb.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
      sb.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
      sb.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
      sb.from('devices').select('*', { count: 'exact', head: true }).gte('last_seen_at', fiveMinAgo),
    ]);

    res.json({
      users: { total: usersRes.count ?? 0 },
      devices: { active: activeDevicesRes.count ?? 0 },
      messages: {
        total: totalRes.count ?? 0,
        pending: pendingRes.count ?? 0,
        sent: sentRes.count ?? 0,
        delivered: deliveredRes.count ?? 0,
        failed: failedRes.count ?? 0,
      },
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ error: 'Could not fetch stats' });
  }
});

adminRouter.post('/update', (req, res) => {
  const child = spawn(process.execPath, [UPDATE_SCRIPT, '--json'], {
    cwd: path.join(__dirname, '..', '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', (chunk) => { stdout += chunk; });
  child.stderr?.on('data', (chunk) => { stderr += chunk; });

  child.on('close', (code) => {
    try {
      const data = JSON.parse(stdout || '{}');
      if (code === 0 && data.success) {
        res.json({
          success: true,
          message: data.message,
          pm2Restart: data.pm2Restart,
        });
      } else {
        res.status(500).json({
          error: data.message || 'Update failed',
          detail: stderr || undefined,
        });
      }
    } catch {
      res.status(500).json({
        error: 'Update failed',
        detail: stderr || stdout || `Exit code ${code}`,
      });
    }
  });

  child.on('error', (err) => {
    console.error('[admin/update]', err);
    res.status(500).json({ error: 'Could not run update script', detail: err.message });
  });
});

adminRouter.get('/api-keys', async (req, res) => {
  try {
    const { data, error } = await req.sb
      .from('api_keys')
      .select('id, name, key_prefix, created_at, users(email)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      apiKeys: (data || []).map((k) => ({
        id: k.id,
        name: k.name,
        key_prefix: k.key_prefix + '…',
        created_at: k.created_at,
        user_email: k.users?.email,
      })),
    });
  } catch (err) {
    console.error('[admin/api-keys]', err);
    res.status(500).json({ error: err.code === '42P01' ? 'Run sql/007_api_keys.sql first' : 'Could not fetch API keys' });
  }
});

adminRouter.post('/api-keys', async (req, res) => {
  const userId = req.body?.user_id;
  const name = String(req.body?.name || 'Default').trim();
  if (!userId) {
    return res.status(400).json({ error: 'user_id required' });
  }
  try {
    const { key, keyHash, keyPrefix } = generateApiKey();
    const { data, error } = await req.sb
      .from('api_keys')
      .insert({ user_id: userId, name, key_hash: keyHash, key_prefix: keyPrefix })
      .select('id, name, key_prefix, created_at')
      .single();

    if (error) throw error;

    res.status(201).json({
      api_key: data,
      secret: key,
      warning: 'Copy the secret now. It will not be shown again.',
    });
  } catch (err) {
    console.error('[admin/api-keys]', err);
    res.status(500).json({
      error: err.code === '42P01' ? 'Run sql/007_api_keys.sql first' : err.message || 'Could not create API key',
    });
  }
});

adminRouter.delete('/api-keys/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const { error } = await req.sb.from('api_keys').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('[admin/api-keys delete]', err);
    res.status(500).json({ error: 'Could not delete API key' });
  }
});

adminRouter.get('/brand', (_req, res) => {
  res.json(readBrandFromFile());
});

adminRouter.patch('/brand', (req, res) => {
  const { site_name, support_email, primary_color } = req.body || {};
  const updates = {};
  if (site_name !== undefined) updates.site_name = site_name;
  if (support_email !== undefined) updates.support_email = support_email;
  if (primary_color !== undefined) updates.primary_color = primary_color;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  writeBrandToFile(updates);
  res.json(readBrandFromFile());
});
