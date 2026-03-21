/**
 * Schema changes are applied in Supabase (no local Postgres URL required).
 *
 * 1. Open Supabase Dashboard → SQL Editor
 * 2. Paste and run the contents of sql/001_initial.sql (or your migrations)
 *
 * This project uses @supabase/supabase-js only — no DATABASE_URL.
 */
console.log(`
SMS LocalBlast — database setup

  • Open: https://supabase.com/dashboard → your project → SQL Editor
  • Run the SQL file: server/sql/001_initial.sql

  Env vars: see server/.env.example (SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY)
`);
