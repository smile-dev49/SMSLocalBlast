# GitHub Actions

Canonical workflow files live in `.github/workflows/` (GitHub discovers them only from that path).

This folder documents CI expectations for SMS LocalBlast:

- Install dependencies with pnpm (Node 22 LTS).
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm build` at the repository root (Turbo orchestrates packages and apps).

See `.github/workflows/ci.yml` for the current pipeline definition.
