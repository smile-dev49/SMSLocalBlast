# Mobile Gateway (Flutter scaffold)

This directory reserves the mobile SMS gateway surface. **No Flutter project is generated yet** per repository policy — only structure and documentation live here.

## Planned implementation

1. Run `flutter create .` from this folder when you are ready to generate platform projects.
2. Adopt the layering described in `docs.md` (`core`, `features`, `data`, `presentation`, platform channels).
3. Keep domain types imported from `@sms-localblast/types` via a small Dart-facing API or generated contracts (ADR to follow).

## Why a gateway app?

The gateway bridges carrier/SMS capabilities on-device with the multi-tenant API, queues, and org policies enforced server-side.
