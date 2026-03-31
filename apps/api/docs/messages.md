# Messages API

Messages are outbound execution records generated from campaign recipients.

## Model highlights

- `OutboundMessage` stores the dispatch lifecycle, retry metadata, failures, timestamps, and optional campaign/device/contact links.
- `MessageStatusEvent` stores transition history (`fromStatus -> toStatus`) for traceability.
- `MessageGatewayEventReceipt` stores `(messageId,eventType,idempotencyKey)` to make gateway callbacks idempotent.

## State machine (foundation)

- `PENDING -> READY -> QUEUED -> DISPATCHING -> DISPATCHED -> SENT -> DELIVERED`
- Any non-terminal can transition to `FAILED` or `CANCELLED`.
- Manual retry reopens `FAILED`/`CANCELLED` to `READY`.

## Failure codes

`failureCode` is currently a string (documented constant strategy), allowing incremental extension:

- `DEVICE_UNAVAILABLE`
- `NO_ELIGIBLE_DEVICE`
- `INVALID_RECIPIENT`
- `RENDER_FAILED`
- `QUEUE_ERROR`
- `TRANSPORT_ERROR`
- `DELIVERY_TIMEOUT`
- `BLOCKED_CONTACT`
- `OPTED_OUT_CONTACT`
- `CAMPAIGN_CANCELLED`

## Queue behavior

- `prepareOutboundMessagesForCampaign` creates `READY` records for `READY` campaign recipients and enqueues them.
- Enqueue marks message `QUEUED` + creates status event.
- Worker/placeholder processing currently claims and transitions to `DISPATCHED` in no-transport mode.

## Endpoints

- `GET /api/v1/messages`
- `GET /api/v1/messages/:messageId`
- `GET /api/v1/messages/:messageId/events`
- `POST /api/v1/messages/:messageId/retry`
- `POST /api/v1/messages/:messageId/cancel`

## Gateway endpoints (device-auth only)

- `POST /api/v1/device-gateway/auth/login`
- `POST /api/v1/device-gateway/dispatch/pull`
- `POST /api/v1/device-gateway/messages/:messageId/ack-dispatch`
- `POST /api/v1/device-gateway/messages/:messageId/report-sent`
- `POST /api/v1/device-gateway/messages/:messageId/report-delivered`
- `POST /api/v1/device-gateway/messages/:messageId/report-failed`
