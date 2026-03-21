import dotenv from 'dotenv';

dotenv.config();

function required(name, fallback = undefined) {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL || '',
  publicOrigin: process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
};

export function assertDatabaseConfigured() {
  if (!env.databaseUrl) {
    console.warn(
      '[config] DATABASE_URL is not set — DB features will fail until you set it in .env'
    );
  }
}
