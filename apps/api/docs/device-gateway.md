# Device Gateway Contract

This backend contract is the bridge for mobile gateway clients (Flutter later).

## Auth

- Device auth is isolated from user auth.
- `POST /api/v1/device-gateway/auth/login` exchanges `deviceIdentifier + secret` for a short-lived gateway token.
- Devices must be active, non-deleted, and not suspended/disconnected.

## Pull/claim

- `POST /api/v1/device-gateway/dispatch/pull` returns next eligible dispatch payload.
- Pull atomically assigns `deviceId`, marks `DISPATCHING`, and records a claim event.

## Callback idempotency

Callbacks require `idempotencyKey` and are deduped using `MessageGatewayEventReceipt`:

- `ack-dispatch`
- `report-sent`
- `report-delivered`
- `report-failed`

Duplicate callback submissions become no-op responses.

## Retry and governor foundation

- Device selection favors active/online/non-critical quota-eligible devices.
- No eligible device schedules retry metadata (or final fail after max retries).
- Retry backoff uses exponential intervals from a base delay.
