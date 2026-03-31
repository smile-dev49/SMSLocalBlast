# SMS LocalBlast Mobile Gateway

Production-oriented Flutter foundation for the device gateway client that integrates with backend gateway endpoints, now with Android native SMS transport bridge.

## Implemented foundation

- Riverpod app shell with bootstrap, login, gateway home, activity, settings/diagnostics screens.
- Typed runtime config via `--dart-define`.
- Device gateway auth flow with secure token storage.
- Dio-based backend API client with auth interceptor.
- Dispatch pull orchestration with:
  - no-overlap polling loop
  - local pending jobs
  - callback outbox retry
  - transport abstraction hook
- Platform transport abstraction:
  - Android native bridge (`AndroidGatewayTransport`) via MethodChannel + EventChannel
  - iOS-limited safe stub (`IosGatewayTransport`) with explicit unsupported signaling
- Connectivity-triggered polling tick support (without heavy background execution yet).

## Android transport integration

### Channel contract

- Method channel: `sms_localblast/gateway_transport/methods`
  - `checkCapabilities`
  - `requestPermissions`
  - `sendMessage`
- Event channel: `sms_localblast/gateway_transport/events`
  - emits `accepted`, `sent`, `delivered`, `failed` events with `messageId` and `correlationId`

### Native Android components

- `GatewayMethodChannelHandler`: method + event wiring
- `GatewayPermissionHelper`: runtime `SEND_SMS` permission flow
- `SmsTransportManager`: native SMS send facade and sent/delivered broadcast handling
- `SmsSendResultEmitter`: event sink emitter for Flutter

### Permissions

- Added Android permission: `android.permission.SEND_SMS`
- Permission state is visible in Diagnostics and Gateway Home.
- If denied, transport returns clean failure (`PERMISSION_DENIED`) and no sent report is generated.

### Correlation strategy

- Each send creates a `correlationId` and embeds both `messageId` and `correlationId` into sent/delivered `PendingIntent` extras.
- Broadcast callbacks emit those IDs back to Flutter over EventChannel.
- Flutter orchestrator tracks in-flight jobs by `messageId` and enqueues backend callbacks:
  - send success -> `report-sent`
  - delivery success -> `report-delivered`
  - failures -> `report-failed`

### Real-device requirement

- Emulator support for telephony/SMS callbacks is limited and not reliable.
- Use a real Android device + SIM/carrier for validating sent/delivered paths.
- Delivery reports are carrier dependent and may arrive delayed or not at all.

## iOS limitation (intentional)

- iOS automated SMS gateway sending is not implemented.
- iOS transport returns explicit unsupported failure (`TRANSPORT_UNSUPPORTED`) and diagnostics reflect this.
- No unofficial or policy-risk workaround is used in this step.

## Config

Use `--dart-define`:

- `API_BASE_URL` (default `http://10.0.2.2:3000/api/v1`)
- `APP_ENV` (`dev|staging|prod`, default `dev`)
- `DISPATCH_POLL_SECONDS` (default `10`)
- `DEBUG_LOGGING` (`true|false`, default `true`)

Example:

`flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1 --dart-define=APP_ENV=dev`

## Local persistence split

- Secure: `flutter_secure_storage` for gateway token + device identifier.
- Non-secure: `shared_preferences` for pending jobs, callback outbox, gateway toggles.

## Next step

Add production hardening around Android execution:

- retries for transport-level correlation failures across app restarts
- dual-SIM routing strategy
- MMS channel support and attachment handoff
- background execution policy integration.
