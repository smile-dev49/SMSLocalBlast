import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  '';

const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.SUPABASE_ANON_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
  '';

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

const jwtSecret = process.env.JWT_SECRET?.trim() || '';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  publicOrigin: process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
  supabaseUrl,
  supabasePublishableKey,
  supabaseServiceRoleKey,
  jwtSecret,
};

export function assertSupabaseConfigured() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    console.warn(
      '[config] Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env (see .env.example)'
    );
  }
  if (!env.supabaseServiceRoleKey) {
    console.warn(
      '[config] SUPABASE_SERVICE_ROLE_KEY missing — /api/auth and /api/messages will return 503. See SETUP.md'
    );
  }
  if (!env.jwtSecret) {
    console.warn(
      '[config] JWT_SECRET missing — auth will not work. Generate: openssl rand -hex 32'
    );
  }
}
