# SMS LocalBlast API (`@sms-localblast/api`)

Production-oriented NestJS monolith for SMS LocalBlast: HTTP API, future workers, and integrations (Excel add-in, admin, gateways).

## Architecture (high level)

| Layer                | Purpose                                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/bootstrap`      | Shared HTTP setup (CORS, helmet, compression, versioning, Swagger, body limits).                                                                           |
| `src/common`         | Cross-cutting: config validation (Zod), filters, guards/decorators (auth placeholders), pipes (`ZodValidationPipe`), logging hooks, exceptions, DTO index. |
| `src/infrastructure` | Prisma, Redis, BullMQ, request context (`AsyncLocalStorage`), health probes.                                                                               |
| `src/modules/*`      | Feature boundaries (skeletons today; business logic comes later).                                                                                          |

**Import rule:** feature modules should depend on `common` and `infrastructure`, not on each other’s internals (avoid cycles).

Deeper notes live under `docs/`.

## Configuration

1. Copy `.env.example` → `.env`.
2. On startup, `ConfigModule` runs `validateConfiguration()`, which parses **merged** `process.env` with **Zod** (`flatEnvSchema` → nested `AppConfig`).
3. Invalid env **fails fast** before the app listens.

`ConfigService` reads nested keys (examples): `port`, `nodeEnv`, `app.apiPrefix`, `redis.url`, `jwt.accessSecret`, `swagger.enabled`, `queue.enabled`.

## Request context

`RequestContextModule` applies middleware that:

- Ensures each request has a **correlation id** (`x-request-id` header or generated UUID).
- Stores **requestId**, **userId**, **organizationId** (placeholders until auth), **ip**, **userAgent** in `AsyncLocalStorage`.

Read values via helpers in `infrastructure/request-context` (do not import request objects into deep services).

## Prisma

- Schema: **`../../prisma/schema.prisma`** (repo root).
- Client generation: `pnpm exec prisma generate` from the repo root (the API `prebuild` runs the same via `pnpm -C ../.. exec prisma generate`).
- `PrismaService` extends `PrismaClient` with connect/disconnect lifecycle.

## Redis & BullMQ

- **Redis:** global `RedisInfrastructureModule`; `RedisService` wraps `ioredis` (ping, raw client).
- **Queues:** `QueueInfrastructureModule` registers BullMQ with prefix from config. Set **`QUEUES_ENABLED=false`** to skip Bull registration (tests, minimal local runs).
- **Producer:** `QueueProducerService` exposes stub enqueue methods for `messages`, `schedules`, `webhooks`, `audit` queues. Real processors belong in worker entrypoints using `queue.worker-registry` patterns.

## Validation

- Environment: Zod in `common/config/env.schema.ts`.
- HTTP: prefer **`ZodValidationPipe`** per route/param/body with shared Zod schemas (from `@sms-localblast/validation` or module-local schemas).

## Local development

From repository root:

```bash
pnpm install
pnpm exec prisma generate
pnpm --filter @sms-localblast/api dev
```

- API base path: **`/api`**
- Versioned routes: **`/api/v1/...`**
- Swagger (when `SWAGGER_ENABLED=true`): **`/api/docs`**

## Health

- **`GET /api/v1/health/live`** — process liveness.
- **`GET /api/v1/health/ready`** — PostgreSQL + Redis; returns **503** when degraded.

## Testing

```bash
# Unit (src/**/*.spec.ts)
pnpm --filter @sms-localblast/api test

# E2E (mocked Prisma/Redis so CI does not require running containers)
pnpm --filter @sms-localblast/api test:e2e

pnpm --filter @sms-localblast/api test:all
```

## Database migrations

From repo root (requires `DATABASE_URL`):

```bash
pnpm exec prisma migrate dev --name init
```

For quick local schema sync without migration history (dev only):

```bash
pnpm exec prisma db push
```
