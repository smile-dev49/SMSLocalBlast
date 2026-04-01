# Campaigns API

Campaigns now run with real outbound execution linkage:

- `start` prepares recipients and creates/queues outbound messages
- message workers update campaign progress counters from outbound state
- recovery jobs can finalize campaigns left in `PROCESSING` when all outbound messages are terminal

## Reconciliation behavior

The recovery sweep calls campaign reconciliation for processing campaigns:

- if every outbound message is terminal (`DELIVERED|FAILED|CANCELLED|SKIPPED`), campaign is auto-finalized
- finalized status:
  - `COMPLETED` if at least one message delivered
  - `FAILED` otherwise

This protects against worker or callback races leaving campaigns in non-terminal processing states.

## Operational endpoint tie-in

- `GET /api/v1/operations/campaigns/processing`
- `POST /api/v1/operations/campaigns/reconcile` (admin-safe action)
