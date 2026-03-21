# SMS LocalBlast

White-label platform: **Excel** → **Node.js API** → **mobile gateways** → SMS/MMS.

## Repo layout

| Folder | Purpose |
|--------|---------|
| `server/` | Node.js + Express API, PostgreSQL, workers (later) |
| `excel-addin/` | Office.js task pane (to be added) |
| `admin-web/` | Admin dashboard (to be added) |

## Quick start (API)

```bash
cd server
cp .env.example .env
# Edit .env — set DATABASE_URL
npm install
npm run dev
```

Health check: `GET http://localhost:3000/api/health`

## Requirements

- Node.js 18+
- PostgreSQL 14+

## Docs

See `../ACTION-PLAN.md` and client specifications in the parent folder.
