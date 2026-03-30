# Devices API (Organization-Scoped)

Devices represent the mobile agents (Android/iOS) that can receive and later send SMS/MMS traffic for an organization.

## Auth + RBAC

All endpoints require an authenticated user session (JWT access token).

Route permissions:

- `devices.read`: `GET /devices`, `GET /devices/:deviceId`
- `devices.write`: `POST /devices`, `PATCH /devices/:deviceId`, `DELETE /devices/:deviceId`
- `devices.manage`: `POST /devices/:deviceId/set-primary`, `PATCH /devices/:deviceId/quota`
- `devices.heartbeat`: `POST /devices/:deviceId/heartbeat`

All operations are strictly scoped to the authenticated user's current organization.

## Endpoints

### `POST /api/v1/devices`

Register/create a device for the current organization.

Request body:

- `name`
- `platform` (`ANDROID` | `IOS`)
- `deviceIdentifier` (unique external identifier)
- optional telemetry fields (`appVersion`, `osVersion`, `deviceModel`, `phoneNumber`, `simLabel`, `pushToken`)
- optional `capabilities` (JSON object)

### `GET /api/v1/devices`

Paginated list with filtering:

- `page`, `limit`
- `search` (matches name, deviceIdentifier, phoneNumber, simLabel)
- `platform`, `status`, `isActive`
- `sortBy`, `sortOrder`

Response:

- `items`, `page`, `limit`, `total`, `totalPages`

### `GET /api/v1/devices/:deviceId`

Fetch a single device for the current organization.

### `PATCH /api/v1/devices/:deviceId`

Update editable fields:

- `name`, `phoneNumber`, `simLabel`, `pushToken`
- `appVersion`, `osVersion`, `deviceModel`
- `metadata`, `capabilities`

### `DELETE /api/v1/devices/:deviceId`

Soft-delete (sets `deletedAt`).

### `POST /api/v1/devices/:deviceId/heartbeat`

Ingest a heartbeat.

Request body:

- `status` (`PENDING | ONLINE | OFFLINE | SUSPENDED | DISCONNECTED`)
- optional `batteryLevel`, `signalStrength`, `networkType`, `appVersion`
- optional `payload` (arbitrary JSON)

Behavior:

- creates a `DeviceHeartbeat` row
- updates device telemetry timestamps and derived `status`/`healthStatus`
- emits an audit event only when the derived device state meaningfully changes

### `POST /api/v1/devices/:deviceId/set-primary`

Sets the device as the single primary device for the organization (transactionally unsets previous primary).

### `PATCH /api/v1/devices/:deviceId/quota`

Updates quota limits and operational state:

- `dailySendLimit`, `hourlySendLimit`
- `isActive` (optional)
- `status` (`SUSPENDED | DISCONNECTED`) for administrative suspension/disconnection

## Derived Status and Health

Derived values are based on:

- `lastHeartbeatAt` recency vs config thresholds:
  - `DEVICE_ONLINE_THRESHOLD_SECONDS`
  - `DEVICE_WARNING_THRESHOLD_SECONDS`
  - `DEVICE_CRITICAL_THRESHOLD_SECONDS`
- battery/signal from the latest heartbeat (when present)
- `SUSPENDED` and `DISCONNECTED` are treated as explicit admin states and map to `healthStatus = UNKNOWN`

## Capabilities Model

`capabilities` is stored as a JSON object to support future expansion without schema changes.

Example:

```json
{
  "smsSend": true,
  "mmsSend": true,
  "deliveryReports": false,
  "backgroundHeartbeat": true
}
```

## Audit Events

The devices module emits:

- `DEVICE_CREATED`
- `DEVICE_UPDATED`
- `DEVICE_DELETED`
- `DEVICE_PRIMARY_SET`
- `DEVICE_QUOTA_UPDATED`
- `DEVICE_HEARTBEAT_RECEIVED` (only when the derived state meaningfully changes)
