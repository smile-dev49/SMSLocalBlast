# SMS LocalBlast Admin Web (`@sms-localblast/admin-web`)

Browser-based **operator and support console** for SMS LocalBlast: authenticated sessions, org context, permission-aware navigation, and read/monitor/control surfaces for devices, campaigns, messages, contacts, templates, and operations.

The **Excel add-in** remains the primary workflow for spreadsheet-driven imports, recipient targeting, and campaign creation. This admin app focuses on **monitoring, support, and control** (queue health, message retries, campaign start/pause/cancel, device quotas, sessions).

## Stack

- Next.js 15 (App Router), React 19, TypeScript (strict)
- Tailwind CSS, lightweight local UI primitives (`src/shared/ui/`)
- TanStack Query for server state
- Typed HTTP client (`src/core/network/http-client.ts`) + feature API modules

## Setup

From the monorepo root:

```bash
pnpm install
```

## Help Center (built-in docs)

After login, open **Help Center** in the sidebar (`/docs`). Articles are typed content modules under `src/features/docs/content/` (no CMS). Topics include getting started, environment variables, Excel add-in and mobile gateway guides, campaigns/messages/workflows, billing, operations, API/Swagger pointers, troubleshooting, and an interactive **launch checklist** with optional live hints from the API.

## Environment variables

| Variable                   | Purpose                                                                     |
| -------------------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | REST base URL including `/api/v1` (default: `http://localhost:3000/api/v1`) |
| `NEXT_PUBLIC_APP_URL`      | Browser origin of this admin app (default: `http://localhost:3001`)         |
| `NEXT_PUBLIC_APP_NAME`     | Optional product label (default: `SMS LocalBlast Admin`)                    |

Copy from `.env.example` if present, or export in your shell.

## Local run

```bash
pnpm --filter @sms-localblast/admin-web dev
```

- Admin UI: **http://localhost:3001**
- API (default): **http://localhost:3000** — start the Nest API separately.

## Auth / session model

- **Login** posts to `POST /auth/login` (no auth header); tokens are stored via `tokenStorage` (localStorage: access + refresh).
- **Bootstrap** calls `GET /auth/me` when an access token exists to hydrate `me` (user, organization, membership, role, **permissions**).
- **Logout** calls `POST /auth/logout` and clears local tokens.
- **401** responses clear tokens and emit `authEvents.emitUnauthorized()` so the shell drops `me` and the dashboard layout redirects to `/login?next=…`.

Route groups:

- `app/login` — public login (Suspense-wrapped for `useSearchParams`).
- `app/(dashboard)/*` — protected shell: sidebar, header, org/user summary, logout.

## Feature overview

| Area        | Route                           | Permission highlights                                                                           |
| ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| Help Center | `/docs`, `/docs/[slug]`         | No extra permission; launch checklist uses API hints when your role allows                      |
| Dashboard   | `/dashboard`                    | Aggregates allowed queries (devices/campaigns/messages/operations)                              |
| Devices     | `/devices`, `/devices/[id]`     | `devices.read`; `devices.manage` for primary + quotas                                           |
| Campaigns   | `/campaigns`, `/campaigns/[id]` | `campaigns.read`; `campaigns.execute` for start/pause/cancel                                    |
| Messages    | `/messages`, `/messages/[id]`   | `messages.read`; `messages.retry` / `messages.cancel` for actions                               |
| Contacts    | `/contacts`, `/contacts/[id]`   | `contacts.read`                                                                                 |
| Templates   | `/templates`, `/templates/[id]` | `templates.read`                                                                                |
| Operations  | `/operations`                   | `operations.read`                                                                               |
| Billing     | `/billing`                      | `billing.read` / `billing.write`                                                                |
| Settings    | `/settings`                     | Sessions need `auth.sessions.read` / `auth.sessions.revoke`; logout-all needs `auth.logout_all` |

Navigation items are filtered with `filterNavForPermissions` (`src/core/auth/permissions.ts`).

## Tests

```bash
pnpm --filter @sms-localblast/admin-web test
```

Vitest + Testing Library; `vitest.config.ts` enables automatic JSX runtime for tests.

## Lint / typecheck / build

```bash
pnpm --filter @sms-localblast/admin-web lint
pnpm --filter @sms-localblast/admin-web typecheck
pnpm --filter @sms-localblast/admin-web build
```

`next build` skips ESLint by config (`eslint.ignoreDuringBuilds`) because co-located `*.test.tsx` files are not part of the TypeScript-eslint project graph; run `lint` explicitly in CI.

## Current limitations

- No white-label installer or chart-heavy analytics (by design for this milestone).
- Operations queue summary endpoints are consumed as implemented by the API; org-scoping should match backend guarantees.
- Campaign creation UI is intentionally minimal; Excel add-in is the primary authoring path.

## Future expansion

- Richer filters (saved views), export, audit log deep links, and real-time updates (SSE/WebSocket).
- Stricter ESLint/tsconfig alignment for test files (or a dedicated `tsconfig.eslint.json`) to re-enable lint during `next build`.
