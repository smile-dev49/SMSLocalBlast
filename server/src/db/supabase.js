import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

let browserClient = null;
let adminClient = null;

/**
 * Supabase client with the publishable (anon) key — respects RLS.
 * Use when the request carries a user JWT (future) or for public reads you allow in RLS.
 */
export function getSupabase() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    return null;
  }
  if (!browserClient) {
    browserClient = createClient(env.supabaseUrl, env.supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return browserClient;
}

/**
 * Service role client — bypasses RLS. Only for trusted server routes.
 * Returns null if SUPABASE_SERVICE_ROLE_KEY is not set.
 */
export function getSupabaseAdmin() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return null;
  }
  if (!adminClient) {
    adminClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClient;
}

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey);
}
