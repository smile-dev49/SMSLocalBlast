import { getSupabaseAdmin } from '../db/supabase.js';
export function requireAdminDb(req, res, next) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({
      error: 'Server database not configured',
      hint: 'Add SUPABASE_SERVICE_ROLE_KEY to .env (see SETUP.md). Never expose this key to clients.',
    });
  }
  req.sb = admin;
  next();
}
