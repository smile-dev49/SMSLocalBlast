# SMS LocalBlast

White-label platform: **Excel** → **Node.js API** → **mobile gateways** → SMS/MMS.

## Repo layout

| Folder | Purpose |
|--------|---------|
| `server/` | Node.js + Express API (Supabase for DB/API) |
| `frontend/` | React SPA (landing, demo, signup, install, admin, docs, privacy, terms, ios-shortcut) |
| `license-server/` | Master license server (verify, revoke, God View; deploy separately) |
| `god-view/` | Author dashboard — served by license-server at /god-view |
| `excel-addin/` | Office.js task pane (login + enqueue from sheet) — served at /add-in |
| `android/` | Android gateway app (poll, send SMS, report status) |
| `landing-web/`, `admin-web/`, etc. | Legacy fallback if `frontend` not built |

## Quick start (API)

```bash
cd server
npm run bootstrap   # checks Node, npm install, creates .env from example
# Edit .env with Supabase keys, then:
npm run dev
```

Or manually: `cp .env.example .env`, `npm install`, `npm run dev`.

**Quick start:** Run `npm run build:frontend` from repo root (or `cd frontend && npm run build`), then `cd server && npm run dev`.  
Landing: **http://localhost:3000** · Health: **http://localhost:3000/api/health**

### Auth & queue (after [SETUP.md](server/SETUP.md))

```http
POST /api/auth/register
Content-Type: application/json

{"email":"you@example.com","password":"yourpassword","terms_accepted":true}

POST /api/auth/login
Content-Type: application/json

{"email":"you@example.com","password":"yourpassword"}

POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{"to_phone":"+15551234567","body":"Hello from LocalBlast"}

POST /api/messages/claim-next
Authorization: Bearer <token>
Content-Type: application/json

{"device_id":"<optional>"}

PATCH /api/messages/<id>/status
Authorization: Bearer <token>
Content-Type: application/json

{"status":"sent"}
```

## Web installer

Visit **http://localhost:3000/install** for the 3-step setup wizard (database, branding, admin account). Run `sql/001_initial.sql` and `sql/002_claim_next_message.sql` in Supabase first.

## Admin dashboard

Visit **http://localhost:3000/admin** and sign in with an admin account. Features: stats, users, API key manager, brand settings (site name, support email, primary color), server health, update button.

## Database schema

Tables are created in **Supabase** (SQL Editor), not via a local Postgres URL. See `server/sql/001_initial.sql`.

```bash
npm run db:sql-help
```

## Licensing

For production, deploy the **license server** (`license-server/`) and set `LICENSE_SERVER_URL` and `PURCHASE_CODE` in the main server `.env`. See `license-server/README.md`.

## Release notifications

On push to `main`, `.github/workflows/notify-update.yml` POSTs to the license server. Configure `MASTER_SERVER_URL` and `MASTER_SERVER_SECRET` in GitHub repo secrets. Admin dashboards show "Update available" when a newer version is published.

## Requirements

- Node.js 18+
- A [Supabase](https://supabase.com) project

## Documentation

- **User & Developer Manual** — http://localhost:3000/docs (installation, API, Excel, Android, iOS, troubleshooting)
- `server/SETUP.md` — Quick setup checklist
- `PACKAGING.md` — CodeCanyon zip packaging
