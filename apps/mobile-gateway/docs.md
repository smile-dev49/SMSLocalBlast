# Mobile gateway architecture (planned)

The Flutter codebase will follow feature-first layering with strict separation of concerns.

## Layers

### `core/`

App-wide primitives: routing, dependency injection, logging, env parsing, error taxonomy, theming tokens shared by presentation.

### `features/<feature>/`

Vertical slices (e.g., `device_registration`, `outbox`, `settings`). Each feature owns:

- UI flows in `presentation/` subfolders (screens/widgets scoped to the feature).
- Use-cases that coordinate repositories — **no** platform APIs here.

### `data/`

Repositories, DTO mappers, REST/gRPC/WebSocket clients, local persistence (SQLite/Isar/Hive), caching. Implements interfaces that `features` depend on.

### `presentation/`

Reusable widgets that are not feature-specific: design system, generic layouts, accessibility helpers.

### Platform channels (`platform/`)

Thin bridges to native capabilities (SMS send/receipt where permitted by OS policy, background execution hooks). **No** business rules in channel handlers.

## Interop with the monorepo

- Server contracts derive from shared OpenAPI or protobuf definitions (future work).
- Dart models must not diverge from `@sms-localblast/types` without an ADR and codegen pipeline.

## Library layout (when generated)

```
lib/
  main.dart
  core/
  data/
  di/
  features/
  presentation/
platform/
  android/
  ios/
```

Add tests alongside features (`test/features/...`) and integration tests under `integration_test/` when hardware flows require it.
