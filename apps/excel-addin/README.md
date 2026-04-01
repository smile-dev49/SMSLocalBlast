# SMS LocalBlast Excel Add-in (`@sms-localblast/excel-addin`)

Production-grade Office.js taskpane foundation for Excel-first operations:

- user auth (login + session restore + logout)
- workbook snapshot read (headers + rows)
- column mapping for contacts import
- contacts import preview/confirm
- template preview with worksheet row merge fields
- campaign list/create/preview/start/pause/cancel basics
- dashboard/status basics for devices/campaigns/messages

## Startup flow

1. `bootstrapApp()` waits for Office host readiness when available.
2. React app mounts with TanStack Query provider.
3. Auth bootstrap calls `/auth/me` when token exists.
4. App renders login or Fluent UI shell tabs.

## Help tab

The **Help** tab (task pane) includes a concise quick start, import/template tips, and a button to open the **admin web Help Center** in the browser. Set `VITE_ADMIN_HELP_URL` to your deployed admin docs base (default `http://localhost:3001/docs`).

## Environment

Configure `.env`:

- `VITE_API_BASE_URL` (example `http://localhost:3000/api/v1`)
- `VITE_APP_NAME`
- `VITE_APP_ENV` (`dev|staging|prod`)
- `VITE_ADMIN_HELP_URL` (optional; full URL to admin Help Center, e.g. `https://admin.example.com/docs`)

## Local development

```bash
pnpm install
pnpm --filter @sms-localblast/excel-addin dev
pnpm --filter @sms-localblast/excel-addin test
```

## Office dev/sideload notes

- This repository currently provides the taskpane web app foundation.
- For local Excel sideloading, point your add-in manifest taskpane URL to the Vite dev server URL.
- Test worksheet flows in Excel Desktop or Excel on the web with Office.js enabled.

## Current limitations

- No AppSource packaging yet.
- No VBA/macros.
- Workbook read currently uses active sheet used-range snapshot only (selected-range and richer metadata can be added next).
- Campaign create flow is intentionally minimal and operator-focused.
