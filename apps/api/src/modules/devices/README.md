# Devices Module

Device management for the SMS LocalBlast platform.

## Responsibilities

- Organization-scoped device registration and lifecycle management (`POST/PATCH/DELETE /devices`)
- Heartbeat ingestion (`POST /devices/:deviceId/heartbeat`)
- Derived device status + health evaluation (online/offline + healthy/warning/critical)
- Primary device enforcement per organization
- Device quota configuration (daily/hourly send limits) for future message dispatch logic

## Notes

- Session-based RBAC is used for now (device token auth comes later).
- All queries are scoped to the authenticated user's current organization.
- Soft-delete is used (`deletedAt`); list/get endpoints exclude deleted devices.
