# SMS LocalBlast Excel Add-in (`@sms-localblast/excel-addin`)

React + Vite workspace that will host the Office.js task pane for spreadsheet-driven SMS/MMS campaigns.

## Status

- **Office.js is not wired yet** — this app is a deterministic dev shell with the folder layout we will extend (`components`, `features`, `lib`, `hooks`, `types`).
- Manifest, SSO, and workbook integration will follow a dedicated ADR.

## Local development

```bash
pnpm install
pnpm --filter @sms-localblast/excel-addin dev
```

## Architecture constraints

- No cross-imports from `apps/admin-web` or `apps/api` — share code only via `@sms-localblast/*` packages.
- Keep components presentational; orchestration belongs in `features` and `lib`.
