# SMS LocalBlast API (`@sms-localblast/api`)

NestJS HTTP service — Excel add-in, admin dashboard, mobile gateway, and workers will call this layer.

## Layout

- `src/common` — filters, guards, interceptors (thin, reusable).
- `src/config` — environment and runtime configuration wiring.
- `src/modules/*` — feature modules with controllers delegating to services.

Controllers stay thin; domain and orchestration move into services and future use-cases, not React components or Office.js taskpanes.

## Local development

From repository root:

```bash
pnpm install
pnpm --filter @sms-localblast/api dev
```

Or after a full build of workspace libraries:

```bash
pnpm dev
```

## Environment

See `.env.example`. Load `.env` locally via `ConfigModule` (expand with Zod or custom schema in an ADR before production cutover).
