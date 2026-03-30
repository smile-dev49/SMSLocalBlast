# Prisma (SMS LocalBlast)

The canonical schema lives here so migrations remain repository-wide and tooling can run from the monorepo root.

## Commands (from repository root)

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev
pnpm exec prisma db push
```

The workspace root declares `@prisma/client` and `prisma`; `pnpm exec prisma generate` (or the API’s `prebuild`, which runs `pnpm -C ../.. exec prisma generate`) writes the client into the install graph before `nest build`.
