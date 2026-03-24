import { env } from '../config/env.js';
import { verifyUserToken } from '../lib/jwt.js';
import { getSupabaseAdmin } from '../db/supabase.js';
import { verifyApiKey } from '../lib/apiKey.js';

export async function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization: Bearer <token>' });
  }
  const token = h.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: 'Empty bearer token' });
  }

  if (env.jwtSecret) {
    try {
      const decoded = verifyUserToken(token);
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
      return next();
    } catch {
    }
  }

  if (token.startsWith('sk_') && token.length >= 20) {
    try {
      const sb = getSupabaseAdmin();
      if (sb) {
        const prefix = token.slice(0, 12);
        const { data: keys } = await sb
          .from('api_keys')
          .select('id, key_hash, user_id, users(id, email, role)')
          .eq('key_prefix', prefix);
        if (keys?.length) {
          for (const k of keys) {
            if (verifyApiKey(token, k.key_hash)) {
              const u = k.users;
              if (u) {
                req.user = {
                  id: u.id,
                  email: u.email,
                  role: u.role || 'user',
                };
                return next();
              }
            }
          }
        }
      }
    } catch {
    }
  }

  return res.status(401).json({ error: 'Invalid or expired token' });
}
