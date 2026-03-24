import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAdminDb } from '../middleware/requireAdminDb.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

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
