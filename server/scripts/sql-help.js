console.log(`
SMS LocalBlast — database setup

  • Open: https://supabase.com/dashboard → your project → SQL Editor
  • Run: server/sql/001_initial.sql (tables)
  • Then: server/sql/002_claim_next_message.sql (queue RPC)
  • If RLS blocks writes: server/sql/003_disable_rls_for_api.sql
  • Optional: server/sql/005_licenses_and_global_settings.sql (licensing, version)

  Env vars: see server/.env.example (SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY)
`);
