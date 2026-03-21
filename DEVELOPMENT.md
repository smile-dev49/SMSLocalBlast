# Development roadmap (living)

## Done (v0.1 scaffold)

- [x] Monorepo folder `sms-localblast/`
- [x] Express API + `/api/health` (Supabase connectivity)
- [x] SQL reference `server/sql/001_initial.sql` — run in **Supabase SQL Editor**
- [x] Env: `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` only (no `DATABASE_URL`)

## Next

1. Ensure tables exist in Supabase (run `sql/001_initial.sql` if not already).
2. Optional: set `SUPABASE_SERVICE_ROLE_KEY` in `.env` for server routes that must bypass RLS (never expose to clients).
3. Implement **auth** + **message queue** using Supabase JS (and/or RLS + user JWTs).

## Full product (from client checklist — later phases)

- Excel add-in, Android APK, iOS Shortcut, admin Tailwind UI, web installer, licensing server, GitHub Actions, demo site, docs, video, CodeCanyon zip.

See `../ACTION-PLAN.md` for the full spec map.
