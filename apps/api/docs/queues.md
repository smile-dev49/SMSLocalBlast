# Queues (BullMQ)

## Roles

- **API process:** enqueue jobs via `QueueProducerService` (or inject named `getQueueToken` queues later).
- **Worker process (future):** separate Node entry that imports the same queue names and registers **processors** using the worker registry pattern in `queue.worker-registry.ts`.

## Configuration

- Connection URL matches **`redis.url`** from app config.
- Key prefix: **`queue.prefix`** (isolates keys per environment).

## Queue names

Constants in `infrastructure/queue/queue.constants.ts`:

- `messages`
- `schedules`
- `webhooks`
- `audit`

Stub job names (e.g. `*.placeholder`) exist only to prove wiring; replace with real job types when implementing workers.

## Disabling queues

Set **`QUEUES_ENABLED=false`** so `AppModule` does not import `QueueInfrastructureModule`. Use this for:

- Unit/e2e tests that must not open Bull connections.
- Environments where workers run in a different deployment and the API never enqueues.
