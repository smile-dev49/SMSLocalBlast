import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ISS = 'sms-localblast';
const EXP = '7d';

export function signUserToken(payload) {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      role: payload.role || 'user',
    },
    env.jwtSecret,
    { expiresIn: EXP, issuer: ISS }
  );
}

export function verifyUserToken(token) {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.verify(token, env.jwtSecret, { issuer: ISS });
}
