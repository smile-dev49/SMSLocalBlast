# Queues (BullMQ)

## Queue topology

- `messages`: dispatch/retry/recovery/dead-letter jobs
- `schedules`: reserved
- `webhooks`: reserved
- `audit`: reserved

## Implemented message jobs

- `messages.dispatch` � per-message execution worker
- `messages.retry-due` � periodic due-retry scanner
- `messages.recovery-sweep` � periodic stuck/callback/campaign consistency sweep
- `messages.dead-letter` � dead-letter marker stream

## Production controls

Environment knobs:

- `MESSAGE_DISPATCH_WORKER_CONCURRENCY`
- `MESSAGE_RETRY_WORKER_CONCURRENCY`
- `MESSAGE_MAX_RETRIES_DEFAULT`
- `MESSAGE_RETRY_BASE_DELAY_SECONDS`
- `MESSAGE_RETRY_MAX_DELAY_SECONDS`
- `MESSAGE_DISPATCH_STUCK_THRESHOLD_SECONDS`
- `MESSAGE_CALLBACK_TIMEOUT_SECONDS`
- `MESSAGE_RECOVERY_SWEEP_SECONDS`
- `MESSAGE_RETRY_BATCH_SIZE`
- `MESSAGE_DEAD_LETTER_THRESHOLD`

## Disable mode

`QUEUES_ENABLED=false` keeps queue infrastructure out of the app module for isolated tests/local utility runs.
