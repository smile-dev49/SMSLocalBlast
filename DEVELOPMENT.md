# Development roadmap (living)

## Done (v0.1 scaffold)

- [x] Monorepo folder `sms-localblast/`
- [x] Express API + `/api/health` (Supabase connectivity)
- [x] SQL reference `server/sql/001_initial.sql` — run in **Supabase SQL Editor**
- [x] Env: Supabase URL + publishable + **service_role** + **JWT_SECRET** (see `server/SETUP.md`)
- [x] `POST /api/auth/register`, `/login` — JWT
- [x] `POST /api/messages`, `POST /api/messages/claim-next`, `PATCH .../status`

## Next

1. Run `server/sql/002_claim_next_message.sql` in Supabase (if not yet).
2. Excel add-in: login + enqueue from sheet.
3. Android gateway: poll `claim-next`, send SMS, `PATCH` status.

## Full product (from client checklist — later phases)

- Excel add-in, Android APK, iOS Shortcut, admin Tailwind UI, web installer, licensing server, GitHub Actions, demo site, docs, video, CodeCanyon zip.

See `../ACTION-PLAN.md` for the full spec map.
