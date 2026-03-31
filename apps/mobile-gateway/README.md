# SMS LocalBlast Mobile Gateway

Production-oriented Flutter foundation for the device gateway client that integrates with backend gateway endpoints.

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
  - Android-first stub (`AndroidGatewayTransport`)
  - iOS-limited safe stub (`IosGatewayTransport`) with explicit unsupported signaling
- Connectivity-triggered polling tick support (without heavy background execution yet).

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

Add native Android SMS transport (platform channel + runtime permissions + sent/delivered hooks), then wire these callbacks into `GatewayOrchestrator`.
