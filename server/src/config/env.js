import dotenv from 'dotenv';

dotenv.config();

/** Supabase project URL (Dashboard → Settings → API → Project URL) */
const supabaseUrl =
  process.env.SUPABASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  '';

/**
 * Publishable / anon key (Dashboard → API → publishable or anon key).
 * Server uses this for Supabase JS; enable RLS policies for your tables.
 */
const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.SUPABASE_ANON_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
  '';

/**
 * Optional. Server-only — bypasses RLS. Never expose to browsers or the Excel add-in.
 * Use when the API must read/write without per-user Supabase Auth JWT.
 */
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  publicOrigin: process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
  supabaseUrl,
  supabasePublishableKey,
  supabaseServiceRoleKey,
};

export function assertSupabaseConfigured() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    console.warn(
      '[config] Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env (see .env.example)'
    );
  }
}
