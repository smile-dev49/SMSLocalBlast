# SMS LocalBlast Admin Web (`@sms-localblast/admin-web`)

Next.js dashboard for operators — tenants, devices, campaigns, and compliance views will live behind this shell.

## Principles

- Pages remain routing and composition only.
- Data access and authorization belong in server actions, route handlers, or dedicated client hooks — not inside `@sms-localblast/ui` components.

## Local development

```bash
pnpm install
pnpm --filter @sms-localblast/admin-web dev
```

Default dev server: http://localhost:3001 (API defaults to http://localhost:3000).
