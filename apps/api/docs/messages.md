# Messages API

Messages are outbound execution records generated from campaign recipients and executed through BullMQ workers.

## Worker architecture

- Queue: `messages`
- Job names:
  - `messages.dispatch`
  - `messages.retry-due`
  - `messages.recovery-sweep`
  - `messages.dead-letter`
- Processor: `MessageWorkerProcessor`
- Producer abstraction: `QueueProducerService`

Dispatch processing (`messages.dispatch`):

1. load message by id
2. no-op if stale/non-queued
3. select eligible device (`MessageDeviceSelectionService`)
4. either schedule retry/failure, or transition `QUEUED -> DISPATCHING -> DISPATCHED`

## Idempotency guarantees

- Queue producer uses deterministic job ids (`dispatch:<messageId>`, singleton sweep jobs).
- `enqueueDispatch` is stale-safe (`READY` only).
- Worker processing no-ops if message no longer in expected status.
- Gateway callbacks are receipt-deduped by `(messageId,eventType,idempotencyKey)`.
- Retry reopen only runs for `FAILED`/`CANCELLED` rows.

## Retry policy

Centralized in `MessageRetryPolicyService`:

- Exponential backoff with cap + jitter
- Retry categories (`NO_ELIGIBLE_DEVICE`, `TRANSPORT_TEMPORARY`, `CALLBACK_TIMEOUT`, `QUEUE_STUCK`, `PERMANENT_FAILURE`)
- `PERMANENT_FAILURE` is never retried
- Retry execution is performed by repeatable `messages.retry-due` jobs

## Dead-letter policy

Dead-letter routing happens when dispatch worker attempts are exhausted (`MESSAGE_DEAD_LETTER_THRESHOLD`).

- Message is marked `FAILED` with `failureCode=DEAD_LETTER`
- Failure context is persisted in `OutboundMessage.metadata.deadLetter`
- A `messages.dead-letter` queue item is emitted for replay/inspection workflows

## Recovery rules

`MessageRecoveryService` repeatable sweep:

- `DISPATCHING` older than `MESSAGE_DISPATCH_STUCK_THRESHOLD_SECONDS`:
  - retry if allowed
  - otherwise fail terminally
- `DISPATCHED` older than `MESSAGE_CALLBACK_TIMEOUT_SECONDS`:
  - retry if allowed
  - otherwise fail terminally
- due failed retries (`nextRetryAt <= now`) are reopened and re-queued
- campaigns stuck in `PROCESSING` are finalized when all outbound messages are terminal

## Endpoints

- `GET /api/v1/messages`
- `GET /api/v1/messages/:messageId`
- `GET /api/v1/messages/:messageId/events`
- `POST /api/v1/messages/:messageId/retry`
- `POST /api/v1/messages/:messageId/cancel`

Gateway endpoints (device-auth only):

- `POST /api/v1/device-gateway/auth/login`
- `POST /api/v1/device-gateway/dispatch/pull`
- `POST /api/v1/device-gateway/messages/:messageId/ack-dispatch`
- `POST /api/v1/device-gateway/messages/:messageId/report-sent`
- `POST /api/v1/device-gateway/messages/:messageId/report-delivered`
- `POST /api/v1/device-gateway/messages/:messageId/report-failed`
