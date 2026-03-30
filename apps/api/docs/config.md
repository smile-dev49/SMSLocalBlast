# Configuration

## Flow

1. `ConfigModule.forRoot({ validate: validateConfiguration })` loads `.env` and merges with `process.env`.
2. `validateConfiguration` calls `parseAppConfig` from `env.schema.ts`.
3. Zod **throws** on invalid values → Nest fails startup with a readable error.

## Typed shape

`AppConfig` (see `common/config/env.schema.ts`) is the canonical structure:

- `nodeEnv`, `port`
- `app`: name, url, apiPrefix, bodyLimit, trustProxy
- `database.url`, `redis.url`
- `jwt`: access/refresh secrets and TTLs (seconds)
- `cors.origins`: array (`*` expands to permissive CORS)
- `swagger.enabled`
- `log.level`
- `queue.prefix`, `queue.enabled`

Nest stores this object as the configuration root, so `ConfigService.get('jwt.accessSecret')` uses nested paths.

## Operational toggles

- **`QUEUES_ENABLED=false`**: omits `QueueInfrastructureModule` from `AppModule` (no BullMQ, no extra Redis usage from workers).
- **`SWAGGER_ENABLED=false`**: skips OpenAPI route registration (recommended in some production profiles).

## Secrets

JWT secrets must be **≥ 16 characters** in schema validation. Use strong random values in every non-local environment.
