import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../../infrastructure/prisma/prisma.service';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

interface PermissionDef {
  code: string;
  description?: string | null;
}

interface RoleDef {
  code: string;
  name: string;
  description?: string | null;
  scope: 'SYSTEM' | 'ORGANIZATION';
  isSystemRole: boolean;
  permissionCodes: readonly string[];
}

const PERMISSIONS: readonly PermissionDef[] = [
  { code: 'auth.me.read', description: 'Read own profile and permissions' },
  { code: 'auth.sessions.read', description: 'List own sessions' },
  { code: 'auth.sessions.revoke', description: 'Revoke one session' },
  { code: 'auth.sessions.revoke_all', description: 'Revoke other sessions' },
  { code: 'auth.logout', description: 'Logout current session' },
  { code: 'auth.logout_all', description: 'Logout from other sessions' },
];

const ROLES: readonly RoleDef[] = [
  {
    code: 'org_owner',
    name: 'Organization Owner',
    description: 'Full control of the organization',
    scope: 'ORGANIZATION',
    isSystemRole: true,
    permissionCodes: PERMISSIONS.map((p) => p.code),
  },
  {
    code: 'org_admin',
    name: 'Organization Admin',
    description: 'Manage organization users and operations',
    scope: 'ORGANIZATION',
    isSystemRole: true,
    permissionCodes: PERMISSIONS.map((p) => p.code),
  },
  {
    code: 'org_manager',
    name: 'Organization Manager',
    description: 'Manage sessions and basic operations',
    scope: 'ORGANIZATION',
    isSystemRole: true,
    permissionCodes: ['auth.me.read', 'auth.sessions.read', 'auth.sessions.revoke'],
  },
  {
    code: 'org_member',
    name: 'Organization Member',
    description: 'Read-only access to own profile and sessions',
    scope: 'ORGANIZATION',
    isSystemRole: true,
    permissionCodes: ['auth.me.read', 'auth.sessions.read'],
  },
];

export async function bootstrapDefaultRbac(prisma: PrismaClientLike): Promise<void> {
  // Permissions + roles are seeded via unique codes; this is safe to call repeatedly.
  await prisma.permission.createMany({
    data: PERMISSIONS.map((p) => ({
      code: p.code,
      description: p.description ?? null,
    })),
    skipDuplicates: true,
  });

  await prisma.role.createMany({
    data: ROLES.map((r) => ({
      code: r.code,
      name: r.name,
      description: r.description ?? null,
      scope: r.scope,
      isSystemRole: r.isSystemRole,
    })),
    skipDuplicates: true,
  });

  const permissionRows = await prisma.permission.findMany({
    where: { code: { in: PERMISSIONS.map((p) => p.code) } },
    select: { id: true, code: true },
  });
  const permissionsByCode = new Map(permissionRows.map((r) => [r.code, r.id]));

  const roleRows = await prisma.role.findMany({
    where: { code: { in: ROLES.map((r) => r.code) } },
    select: { id: true, code: true },
  });
  const rolesByCode = new Map(roleRows.map((r) => [r.code, r.id]));

  const rolePermissions = ROLES.flatMap((r) =>
    r.permissionCodes.map((permCode) => ({
      roleId: rolesByCode.get(r.code),
      permissionId: permissionsByCode.get(permCode),
    })),
  ).filter(
    (rp): rp is { roleId: string; permissionId: string } =>
      rp.roleId !== undefined && rp.permissionId !== undefined,
  );

  await prisma.rolePermission.createMany({
    data: rolePermissions.map((rp) => ({
      roleId: rp.roleId,
      permissionId: rp.permissionId,
    })),
    skipDuplicates: true,
  });
}
