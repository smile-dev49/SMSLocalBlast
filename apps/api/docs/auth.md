# Auth Foundation (Multi-Tenant, Session-Backed)

This milestone implements the production auth and RBAC foundation for SMS LocalBlast:

- org-scoped identity (`Organization`, `User`, `Membership`)
- JWT access + JWT refresh tokens
- DB-backed session history + refresh rotation
- org membership-aware request principal and guards
- audit emission hooks for auth/session events

All auth routes are versioned under `/api/v1/auth/*`.

## Token model

- Access token: short-lived JWT signed with `jwt.accessSecret`
- Refresh token: long-lived JWT signed with `jwt.refreshSecret`
- Refresh rotation: the **raw** refresh token is never stored in DB
  - DB stores `Session.refreshTokenHash`
  - refresh endpoint verifies signature, then compares `sha256(refreshToken)` to the stored hash

### Access token payload (claims)

The access token includes at minimum:

- `sub`: userId
- `sessionId`: DB session id
- `organizationId`: organization context (nullable for future system tokens)
- `membershipId`: membership context (nullable for future system tokens)
- `roleCode`: role code (e.g. `org_owner`)
- `roleScope`: `ORGANIZATION` or `SYSTEM`

## Session semantics

Sessions are stored in the `Session` table and support:

- login history (`createdAt`, `lastUsedAt`)
- refresh rotation (`refreshTokenHash`, `expiresAt`)
- revocation (`isRevoked`, `revokedAt`)

### Revocation behavior

- `POST /logout` revokes the current session only.
- `POST /logout-all` revokes all other sessions for the user and keeps the current session active.

## Multi-tenant login context

On login, the system derives an active org/membership context:

1. If `organizationSlug` is provided:
   - the membership for that org must be active.
2. If `organizationSlug` is not provided:
   - if the user has exactly one active membership, that org is selected.
   - if the user has multiple active memberships, login fails with a clear error requiring org selection.

Authorization always requires:

- user `globalStatus=ACTIVE` and not soft-deleted
- membership status `ACTIVE`
- organization status `ACTIVE` and not soft-deleted

## Endpoints

Public (no auth required):

- `POST /api/v1/auth/register`
  - creates an organization + the first owner user in one transaction
- `POST /api/v1/auth/login`
  - issues tokens and creates a DB session
- `POST /api/v1/auth/refresh`
  - verifies refresh token, compares refresh hash, rotates refresh token, issues new tokens

Auth-required:

- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
  - returns user + current org + membership + role + resolved permissions
- `GET /api/v1/auth/sessions`
  - returns the current user's session history (no refresh hashes)
- `DELETE /api/v1/auth/sessions/:sessionId`
  - revokes an owned session

## Audit hooks

The auth implementation emits audit events via `AuditLogService.emit` for:

- `auth.register`
- `auth.login`
- `auth.refresh`
- `auth.logout`
- `auth.logout_all`
- `session.revoked` (emitted for each revoked session)

Current `AuditLogService` logs structured events; persistence can be added in a later milestone.
