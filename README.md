# SMS LocalBlast

White-label platform: **Excel** → **Node.js API** → **mobile gateways** → SMS/MMS.

## Repo layout

| Folder | Purpose |
|--------|---------|
| `server/` | Node.js + Express API (Supabase for DB/API) |
| `license-server/` | Master license server (verify, revoke, God View; deploy separately) |
| `god-view/` | Author dashboard (stats, licenses, revoke) — served by license-server at /god-view |
| `excel-addin/` | Office.js task pane (login + enqueue from sheet) |
| `android/` | Android gateway app (poll, send SMS, report status) |
| `admin-web/` | Admin dashboard (users, stats, health) |
| `landing-web/` | Marketing landing page (hero, calculator, FAQ) — served at / |
| `demo-web/` | Live demo (simulated sending, no real SMS) — served at /demo |
| `ios-shortcut/` | iOS Shortcut recipe + QR code page |
| `docs/` | User & Developer manual (HTML) — served at /docs |
| `legal/` | Privacy Policy, Terms of Service — /privacy, /terms |
| `signup-web/` | Sign-up page with Terms checkbox — served at /signup |

## Quick start (API)

```bash
cd server
npm run bootstrap   # checks Node, npm install, creates .env from example
# Edit .env with Supabase keys, then:
npm run dev
```

Or manually: `cp .env.example .env`, `npm install`, `npm run dev`.

Landing page: **http://localhost:3000** · Health check: **http://localhost:3000/api/health**

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
