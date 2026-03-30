# RBAC Foundation (Roles + Permissions)

This milestone adds org-scoped RBAC primitives and route protection foundations.

## Prisma authorization model

Key tables:

- `Role` (organization-scoped by default)
  - `scope`: `ORGANIZATION` or `SYSTEM`
  - `code`: stable unique role identifier (e.g. `org_owner`)
  - `isSystemRole`: marks seed/system-defined roles
- `Permission`
  - `code`: permission identifier (e.g. `auth.me.read`, `auth.sessions.revoke`)
- `RolePermission`
  - join table between roles and permissions
- `Membership`
  - connects `User` to `Organization` and links the membership to a `Role`

## Seeded defaults (idempotent)

The repo provides deterministic, idempotent RBAC bootstrapping via:

- `apps/api/src/modules/auth/rbac/bootstrap-default-rbac.ts`
- `apps/api/src/scripts/seed-auth-rbac.ts`

Default roles created:

- `org_owner`
- `org_admin`
- `org_manager`
- `org_member`

Default permissions are assigned per role to support the auth/session endpoints implemented in this milestone.

## Runtime principal shape

When an access token is presented, `JwtStrategy` resolves a request principal:

- `userId`
- `sessionId`
- `organizationId`
- `membershipId`
- `roleCode`
- resolved `permissions: string[]` from `RolePermission`

This principal is accessible via `@CurrentUser()`.

## Decorators and guards

- `@Public()`
  - bypasses auth requirement for the route
- `@Roles(...roleCodes)`
  - role-aware authorization foundation
- `@Permissions(...permissionCodes)`
  - permission-aware authorization foundation (route protection)

Guards are global and consult the principal resolved from JWT + DB membership.

## Membership-aware authorization rules

During principal resolution:

- suspended users cannot authenticate (`User.globalStatus != ACTIVE`)
- suspended/inactive memberships cannot be used (`Membership.status=ACTIVE` required)
- suspended organizations cannot be used (`Organization.status=ACTIVE` required)

These rules ensure all later org-scoped modules can rely on the same principal.
