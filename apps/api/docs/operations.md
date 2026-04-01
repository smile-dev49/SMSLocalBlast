# Operations API

Operational visibility and recovery endpoints are admin-protected (`operations.read` / `operations.write`).

## Read endpoints

- `GET /api/v1/operations/queues/summary`
  - outbound message status counts from Postgres
- `GET /api/v1/operations/queues/lag`
  - Bull queue counts (`active`, `waiting`, `delayed`, `failed`, etc.)
- `GET /api/v1/operations/messages/stuck?limit=200`
  - dispatching messages older than configured stuck threshold
- `GET /api/v1/operations/messages/dead-letter?limit=200`
  - messages marked by dead-letter policy
- `GET /api/v1/operations/campaigns/processing?limit=200`
  - campaigns still in `PROCESSING`
- `GET /api/v1/operations/devices/availability`
  - eligible/unavailable/total device counts

## Safe action endpoints

- `POST /api/v1/operations/messages/recover-stuck`
  - run one recovery sweep now
- `POST /api/v1/operations/campaigns/reconcile`
  - run one campaign processing reconciliation pass

## Notes

- Endpoints are read-heavy and intentionally support small limit controls.
- Recovery endpoints are idempotent enough for operator-triggered reruns.
- Future expansion can add dead-letter replay endpoint with stricter audit controls.
