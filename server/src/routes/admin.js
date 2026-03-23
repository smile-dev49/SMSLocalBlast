import { Router } from 'express';
import { requireAdminDb } from '../middleware/requireAdminDb.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

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
    const [
      usersRes,
      totalRes,
      pendingRes,
      sentRes,
      deliveredRes,
      failedRes,
    ] = await Promise.all([
      sb.from('users').select('*', { count: 'exact', head: true }),
      sb.from('messages').select('*', { count: 'exact', head: true }),
      sb.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      sb.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
      sb.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
      sb.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    ]);

    res.json({
      users: { total: usersRes.count ?? 0 },
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
