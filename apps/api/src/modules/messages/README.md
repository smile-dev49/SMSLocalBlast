# Messages module

Execution layer for outbound campaign messages, queue handoff, device-gateway pull/ack/report callbacks, status-event history, retry metadata, and campaign progress rollups.

## Included in this step

- `OutboundMessage` + `MessageStatusEvent` persistence and state transitions.
- `MessageGatewayEventReceipt` idempotency receipts for gateway callbacks.
- Device-gateway auth/login and pull + report endpoints.
- Queue enqueue hooks and no-transport dispatch placeholder.
- Manual retry/cancel endpoints and operations visibility endpoints.
