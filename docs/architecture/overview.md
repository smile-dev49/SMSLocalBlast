# SMS LocalBlast — architecture overview

## Purpose

SMS LocalBlast is an **Excel-first** SMS/MMS campaign platform delivered as multi-tenant SaaS. Operators design audiences and message templates in spreadsheets; a mobile gateway, API, and admin surfaces coordinate delivery with policy, audit, and billing boundaries.

## System composition (foundation phase)

| Surface               | Responsibility                             | Tech               |
| --------------------- | ------------------------------------------ | ------------------ |
| `apps/api`            | Multi-tenant HTTP + async workers (future) | NestJS, TypeScript |
| `apps/admin-web`      | Internal/admin dashboard                   | Next.js, React     |
| `apps/excel-addin`    | Office task pane (dev shell today)         | React, Vite        |
| `apps/mobile-gateway` | On-device SMS bridge (placeholder)         | Flutter (planned)  |
| `packages/*`          | Shared types, validation, UI shells, etc.  | TypeScript         |

Data persistence targets **Supabase Postgres**; queue and schedule infrastructure will align with ADRs as business modules land.

## Tenancy and boundaries

- **Organizations** own users, devices, contacts, templates, campaigns, and billing configuration.
- **Shared types** express IDs and cross-cutting DTO shapes in `@sms-localblast/types` — apps must not fork domain types locally.
- **Validation** lives in `@sms-localblast/validation` (Zod) to keep controllers/pages thin and consistent.

## Engineering rules

1. **No cross-app imports** — only `@sms-localblast/*` or your app's relative modules.
2. **Thin controllers and route handlers** — orchestration belongs in services / server actions / feature modules.
3. **No business logic in presentational UI** — `@sms-localblast/ui` stays data-agnostic.
4. **Strict TypeScript** — avoid `any`; prefer precise types and narrow parsing at boundaries.
5. **Observability and audit** — new capabilities must plan for structured logs and audit trails (runbooks + ADRs).

## Next steps

- Flesh out authentication/authorization and Supabase schema migrations.
- Introduce job runners for campaigns and message dispatch.
- Define OpenAPI or protobuf contracts so Flutter, Excel, and the API share the same source of truth.
