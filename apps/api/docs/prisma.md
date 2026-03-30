# Prisma usage

## Schema location

`prisma/schema.prisma` at the **repository root** (single source of truth for the backend).

## Client generation

From root:

```bash
pnpm exec prisma generate
```

The API package `prebuild` script runs `prisma generate --schema ../../prisma/schema.prisma` so `nest build` always sees an up-to-date client.

## Nest integration

- `PrismaInfrastructureModule` is `@Global()` and exports `PrismaService`.
- `PrismaService` extends `PrismaClient` and connects in `onModuleInit`, disconnects on shutdown.

## Foundation models (current)

`Organization`, `User`, `Role`, `Membership`, `Session`, `AuditLog` — enough to represent multi-tenant membership and audit metadata. Product tables (campaigns, messages, etc.) arrive with their feature modules.

## Migrations

Use `prisma migrate dev` in development and `prisma migrate deploy` in production CI/CD after the first migration is committed.
