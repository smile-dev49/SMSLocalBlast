# Configuration

## Flow

1. `ConfigModule.forRoot({ validate: validateConfiguration })` loads `.env` and merges with `process.env`.
2. `validateConfiguration` calls `parseAppConfig` from `env.schema.ts`.
3. Zod throws on invalid values and startup fails fast.

## Typed shape

`AppConfig` includes:

- app/http: `app.*`, `port`
- storage: `database.url`, `redis.url`
- auth: `jwt.*`
- observability: `log.level`, `swagger.enabled`
- queue controls:
  - `queue.prefix`, `queue.enabled`
  - `queue.workers.dispatchConcurrency`
  - `queue.workers.retryConcurrency`
  - `queue.message.maxRetriesDefault`
  - `queue.message.retryBaseDelaySeconds`
  - `queue.message.retryMaxDelaySeconds`
  - `queue.message.dispatchStuckThresholdSeconds`
  - `queue.message.callbackTimeoutSeconds`
  - `queue.message.recoverySweepSeconds`
  - `queue.message.retryBatchSize`
  - `queue.message.deadLetterThreshold`

## Operational toggles

- `QUEUES_ENABLED=false`: omit queue infra from `AppModule`
- `SWAGGER_ENABLED=false`: disable OpenAPI route registration

## Secrets

JWT and device gateway secrets must be strong random values per environment.

## Billing (Stripe)

Flat env vars mapped under `billing.stripe.*`:

| Variable                           | Purpose                                                           |
| ---------------------------------- | ----------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`                | Stripe API secret (backend only)                                  |
| `STRIPE_WEBHOOK_SECRET`            | Webhook signing secret for `POST /api/v1/billing/webhooks/stripe` |
| `STRIPE_DEFAULT_CURRENCY`          | Default currency code (e.g. `usd`) for future price display       |
| `STRIPE_SUCCESS_URL`               | Checkout success redirect URL                                     |
| `STRIPE_CANCEL_URL`                | Checkout cancel redirect URL                                      |
| `STRIPE_BILLING_PORTAL_RETURN_URL` | Return URL after Billing Portal                                   |
