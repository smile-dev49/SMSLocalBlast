# SMS LocalBlast

White-label platform: **Excel** → **Node.js API** → **mobile gateways** → SMS/MMS.

## Repo layout

| Folder | Purpose |
|--------|---------|
| `server/` | Node.js + Express API (Supabase for DB/API) |
| `excel-addin/` | Office.js task pane (to be added) |
| `admin-web/` | Admin dashboard (to be added) |

## Quick start (API)

```bash
cd server
cp .env.example .env
# Edit .env — set SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY from Supabase Dashboard → Settings → API
npm install
npm run dev
```

Health check: `GET http://localhost:3000/api/health`

## Database schema

Tables are created in **Supabase** (SQL Editor), not via a local Postgres URL. See `server/sql/001_initial.sql`.

```bash
npm run db:sql-help
```

## Requirements

- Node.js 18+
- A [Supabase](https://supabase.com) project

## Docs

See `../ACTION-PLAN.md` and client specifications in the parent folder.
