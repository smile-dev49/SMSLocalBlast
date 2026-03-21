# Development roadmap (living)

## Done (v0.1 scaffold)

- [x] Monorepo folder `sms-localblast/`
- [x] Express API + `/api/health` + DB ping when `DATABASE_URL` is set
- [x] SQL migration `server/sql/001_initial.sql` (users, devices, messages)
- [x] `npm run db:migrate` script

## Next (your turn + we continue in chat)

1. Install PostgreSQL locally (or use Supabase), create DB `sms_localblast`.
2. Copy `server/.env.example` → `server/.env`, set `DATABASE_URL`.
3. Run: `cd server && npm run db:migrate`
4. Next implementation session: **auth** (register/login JWT) + **enqueue/pull** queue API.

## Full product (from client checklist — later phases)

- Excel add-in, Android APK, iOS Shortcut, admin Tailwind UI, web installer, licensing server, GitHub Actions, demo site, docs, video, CodeCanyon zip.

See `../ACTION-PLAN.md` for the full spec map.
