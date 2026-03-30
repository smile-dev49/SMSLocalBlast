# Backend architecture overview

## Monolith-first modular NestJS

The API is a **single deployable** with clear **module boundaries** so teams can grow features without turning each domain into a microservice prematurely.

## Layers

1. **Bootstrap** (`main.ts`, `bootstrap/http-application.ts`)  
   Nest factory, Pino logger, graceful shutdown, global prefix `/api`, URI versioning default `v1`, security middleware, Swagger when enabled.

2. **Common** (`src/common`)  
   Reusable building blocks only. No feature-specific Prisma calls here.

3. **Infrastructure** (`src/infrastructure`)  
   Shared technical capabilities: ORM, Redis, queues, request correlation, health aggregation.

4. **Modules** (`src/modules`)  
   Vertical slices: each exports a Nest `*Module` with a thin controller and a service that will host use-cases later.

## Global concerns

- **Exception normalization:** `HttpExceptionFilter` returns a consistent error envelope with `requestId` in `meta`.
- **Auth placeholders:** `AccessPlaceholderGuard` is global and allows all routes unless annotated with `@Public()` (inverse is prepared for real JWT guards later).
- **Audit contract:** `AuditLogsModule` / audit service interface records **intent** for structured events; persistence rules evolve with product requirements.

## What is intentionally not built yet

- Login/signup and refresh-token flows.
- CRUD for product entities beyond Prisma schema stubs.
- Bull **consumers** (only producer scaffolding and worker registry stub).

This keeps the codebase compiling while establishing patterns for Prompt 3+.
