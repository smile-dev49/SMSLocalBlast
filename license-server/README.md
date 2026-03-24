# SMS LocalBlast License Server

Master license server for validating purchase codes. Deploy separately (e.g. `manager.smslocalblast.com`).

## Setup

1. Create a **separate** Supabase project for the license server.
2. Run `server/sql/005_licenses_and_global_settings.sql` in the Supabase SQL Editor.
3. Add purchase codes to the `licenses` table (manually or via future God View):

   ```sql
   INSERT INTO licenses (purchase_code, buyer_username, status)
   VALUES ('codecanyon-purchase-code-here', 'buyer_username', 'active');
   ```

4. Copy `.env.example` to `.env` and set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Run

```bash
cd license-server
npm install
npm run dev
```

## API

### POST /api/v1/verify-license

Request:
```json
{ "purchase_code": "...", "domain": "example.com" }
```

Response (valid):
```json
{ "valid": true, "domain": "example.com" }
```

Response (invalid):
```json
{ "valid": false, "reason": "License already activated on a different domain" }
```

### POST /api/v1/revoke-license (Kill switch)

Requires `Authorization: Bearer <REVOKE_SECRET>`. Set `REVOKE_SECRET` in `.env`.

Request:
```json
{ "purchase_code": "..." }
```

Revokes the license; the next verify-license call will return `valid: false` and the client will exit.

## God View (Author dashboard)

Set `GOD_VIEW_SECRET` in `.env`, then visit **http://localhost:3001/god-view**. Enter the secret to access:

- Stats: total licenses, active, activated (in use), revoked
- License table with revoke button
- Uses same auth as revoke (GOD_VIEW_SECRET or REVOKE_SECRET)

- First activation: binds the license to the domain.
- Subsequent checks: must match the registered domain.
- Revoked/suspended licenses return `valid: false`.

## Release notifications (GitHub Action)

Set `RELEASE_SECRET` or `MASTER_SERVER_SECRET` in `.env`. Add to GitHub repo secrets:
- `MASTER_SERVER_URL` — license server URL (e.g. https://manager.smslocalblast.com)
- `MASTER_SERVER_SECRET` — same as RELEASE_SECRET

On push to `main`, the workflow POSTs to `/api/v1/release-new-version`. Buyer admin dashboards show "Update available" when `GET /api/update-check` detects a newer version.

## Client configuration

In the buyer's SMS LocalBlast `.env`:

```
LICENSE_SERVER_URL=https://manager.smslocalblast.com
PURCHASE_CODE=their-codecanyon-purchase-code
PUBLIC_ORIGIN=https://their-domain.com
```

If `LICENSE_SERVER_URL` and `PURCHASE_CODE` are not set, the client skips license checks (dev/demo).
