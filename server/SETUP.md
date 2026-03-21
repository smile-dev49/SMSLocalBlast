# Before you use the API (checklist)

## 1. Tables in Supabase

You already have **`users`**, **`devices`**, **`messages`**. Compare columns to `sql/001_initial.sql` (especially `messages.status` as enum `message_status`).

## 2. Run the queue RPC (one-time)

In **Supabase → SQL Editor**, run **`sql/002_claim_next_message.sql`**.

This adds a safe “pick next pending message” function for phones (no double-claim).

## 3. Add secrets to `.env` (server only)

| Variable | Where to get it |
|----------|------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → **Settings → API → service_role** (the long secret, NOT anon/publishable) |
| `JWT_SECRET` | Generate a long random string (e.g. `openssl rand -hex 32`) |

**Never** put `SUPABASE_SERVICE_ROLE_KEY` in the Excel add-in, frontend, or GitHub.

### If you get "violates row-level security policy"

1. Run **`sql/003_disable_rls_for_api.sql`** in Supabase SQL Editor.
2. Or ensure you use the **service_role** key (not anon) — it bypasses RLS.

## 4. Restart the server

```bash
npm run dev
```

## 5. Smoke test

1. `POST /api/auth/register` → create user  
2. `POST /api/auth/login` → copy `token`  
3. `POST /api/messages` with `Authorization: Bearer <token>` → enqueue  
4. `POST /api/messages/claim-next` with same header → device gets one row  

See `README.md` for example bodies.
