# Docker images

- `Dockerfile.api` — production-oriented image for `@sms-localblast/api`.
- `Dockerfile.admin-web` — Next.js standalone bundle for `@sms-localblast/admin-web`.

Build from the repository root (so workspace resolution works):

```bash
docker build -f infra/docker/Dockerfile.api -t sms-localblast-api:local .
docker build -f infra/docker/Dockerfile.admin-web -t sms-localblast-admin:local .
```

Ensure `pnpm-lock.yaml` exists (`pnpm install` at least once) before relying on `--frozen-lockfile`.
