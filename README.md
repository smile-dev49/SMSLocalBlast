# SMS LocalBlast

Production-grade monorepo foundation for **SMS LocalBlast**, an Excel-first SMS/MMS campaign platform with a Node API, Supabase Postgres, an Office add-in, a Flutter mobile gateway (planned), and an admin dashboard.

This repository contains **infrastructure and scaffolding only** — business modules (campaigns, billing, webhooks, and so on) are intentionally out of scope for this phase.

## Repository layout

| Path                   | Role                                                                              |
| ---------------------- | --------------------------------------------------------------------------------- |
| `apps/api`             | NestJS HTTP API — health check, config placeholder, `common/` + `modules/` layout |
| `apps/admin-web`       | Next.js admin UI — App Router, Tailwind, placeholder dashboard                    |
| `apps/excel-addin`     | React + Vite task pane **shell** (Office.js integration deferred)                 |
| `apps/mobile-gateway`  | **Flutter scaffold** — README + `docs.md` only (no generated app)                 |
| `packages/config`      | Shared strict `tsconfig` base                                                     |
| `packages/types`       | Cross-app TypeScript types                                                        |
| `packages/validation`  | Zod schemas / parsers                                                             |
| `packages/constants`   | Non-secret shared constants                                                       |
| `packages/utils`       | Pure utilities                                                                    |
| `packages/ui`          | Presentational React primitives                                                   |
| `infra/docker`         | Production-oriented Dockerfiles for API + admin                                   |
| `infra/github-actions` | CI documentation (workflows live in `.github/workflows`)                          |
| `docs/architecture`    | High-level system overview                                                        |
| `docs/adr`             | Architecture Decision Record template                                             |
| `docs/runbooks`        | Incident runbook template                                                         |
| `scripts`              | Placeholder for automation entry points                                           |

## Prerequisites

- **Node.js** 20.10+ (CI and Docker use 22 LTS)
- **pnpm** 9+ (`packageManager` is pinned in root `package.json`)

## Local setup

```bash
pnpm install
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

Copy env samples before running services:

- Root: `.env.example`
- `apps/api/.env.example`
- `apps/admin-web/.env.example`
- `apps/excel-addin/.env.example`

`@nestjs/config` loads `.env` from the API working directory when present. You can also use Node’s built-in env file loading (20+), for example `node --env-file=.env apps/api/dist/main.js`, when running compiled output manually.

## Scripts (root)

| Script           | Description                                                          |
| ---------------- | -------------------------------------------------------------------- |
| `pnpm dev`       | `turbo dev` — runs `dev` tasks where defined (API watch, Next, Vite) |
| `pnpm build`     | `turbo build` — libraries + apps                                     |
| `pnpm lint`      | ESLint (type-checked) across workspaces                              |
| `pnpm typecheck` | `tsc --noEmit` / project checks per package                          |
| `pnpm test`      | Vitest (packages + Excel) and Jest (API)                             |
| `pnpm format`    | Prettier write                                                       |
| `pnpm prepare`   | Husky install (Git hooks)                                            |

## Engineering standards

1. **No cross-app imports** — share code only via `@sms-localblast/*` packages.
2. **Thin controllers and route handlers** — orchestration belongs in services, use-cases, or server modules — not in React views.
3. **Shared domain types** live in `@sms-localblast/types`; do not duplicate shapes inside apps.
4. **Validation at boundaries** — Zod parsers in `@sms-localblast/validation` (extend over time).
5. **Strict TypeScript** — `strict` + additional checks in `packages/config/tsconfig/base.json`; avoid `any`.
6. **Git hooks** — Husky runs `lint-staged` (Prettier + ESLint); commit messages use **Conventional Commits** via Commitlint.
7. **Conventional commits** — required by Commitlint (`commitlint.config.cjs`).

## Platform notes

- **Windows**: `next.config.ts` disables `output: 'standalone'` by default to avoid symlink errors during `next build`. Linux CI and Docker set `NEXT_STANDALONE_OUTPUT=true` (see `infra/docker/Dockerfile.admin-web`).
- **Excel add-in**: Vite aliases `@sms-localblast/types` to **TypeScript source** so bundling does not rely on CJS named-export interop from `dist`. Runtime consumers (Nest) continue to use compiled `dist` outputs.

## Docker

See `infra/docker/README.md`. Builds assume a committed `pnpm-lock.yaml`.

## CI

GitHub Actions workflow: `.github/workflows/ci.yml` — install (frozen lockfile), lint, typecheck, test, build.

## Documentation

- Architecture: `docs/architecture/overview.md`
- ADR template: `docs/adr/0000-template.md`
- Runbook template: `docs/runbooks/_template.md`

## License

Private / unlicensed until you add a `LICENSE` file for distribution.
