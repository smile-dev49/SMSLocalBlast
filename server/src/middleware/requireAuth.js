import { env } from '../config/env.js';
import { verifyUserToken } from '../lib/jwt.js';

export function requireAuth(req, res, next) {
  if (!env.jwtSecret) {
    return res.status(503).json({ error: 'JWT_SECRET not configured' });
  }
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization: Bearer <token>' });
  }
  const token = h.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: 'Empty bearer token' });
  }
  try {
    const decoded = verifyUserToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
