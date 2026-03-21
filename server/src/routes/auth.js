import { Router } from 'express';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signUserToken } from '../lib/jwt.js';
import { requireAdminDb } from '../middleware/requireAdminDb.js';

export const authRouter = Router();

authRouter.use(requireAdminDb);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

authRouter.post('/register', async (req, res) => {
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || '');

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const { data: existing } = await req.sb
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const password_hash = await hashPassword(password);
  const { data, error } = await req.sb
    .from('users')
    .insert({ email, password_hash, role: 'user' })
    .select('id, email, role, created_at')
    .single();

  if (error) {
    console.error('[auth/register]', error);
    const payload = { error: 'Could not create user' };
    if (process.env.NODE_ENV !== 'production') {
      payload.detail = error.message;
      payload.code = error.code;
    }
    return res.status(500).json(payload);
  }

  const token = signUserToken({
    sub: data.id,
    email: data.email,
    role: data.role,
  });

  res.status(201).json({
    user: { id: data.id, email: data.email, role: data.role },
    token,
  });
});

authRouter.post('/login', async (req, res) => {
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  const { data: user, error } = await req.sb
    .from('users')
    .select('id, email, role, password_hash')
    .eq('email', email)
    .maybeSingle();

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signUserToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    user: { id: user.id, email: user.email, role: user.role },
    token,
  });
});
