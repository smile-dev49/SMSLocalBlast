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
npm install
npm run dev
```

Health check: `GET http://localhost:3000/api/health`

### Auth & queue (after [SETUP.md](server/SETUP.md))

```http
POST /api/auth/register
Content-Type: application/json

{"email":"you@example.com","password":"yourpassword"}

POST /api/auth/login
Content-Type: application/json

{"email":"you@example.com","password":"yourpassword"}

POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{"to_phone":"+15551234567","body":"Hello from LocalBlast"}

POST /api/messages/claim-next
Authorization: Bearer <token>

PATCH /api/messages/<id>/status
Authorization: Bearer <token>
Content-Type: application/json

{"status":"sent"}
```

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
