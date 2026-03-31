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
  { code: 'devices.read', description: 'Read organization devices' },
  { code: 'devices.write', description: 'Create/update/delete organization devices' },
  { code: 'devices.manage', description: 'Manage device primary/quota settings' },
  { code: 'devices.heartbeat', description: 'Send organization device heartbeats' },
  { code: 'contacts.read', description: 'Read organization contacts' },
  { code: 'contacts.write', description: 'Create/update/delete contacts' },
  { code: 'contacts.manage', description: 'Manage contact suppression/compliance state' },
  { code: 'contact-lists.read', description: 'Read organization contact lists' },
  { code: 'contact-lists.write', description: 'Manage organization contact lists and memberships' },
  { code: 'imports.contacts', description: 'Preview and confirm contact imports' },
  { code: 'templates.read', description: 'Read organization templates' },
  { code: 'templates.write', description: 'Create/update organization templates' },
  { code: 'templates.manage', description: 'Archive/delete templates' },
  { code: 'templates.render', description: 'Validate and render template previews' },
  { code: 'campaigns.read', description: 'Read organization campaigns' },
  { code: 'campaigns.write', description: 'Create/update/delete organization campaigns' },
  { code: 'campaigns.manage', description: 'Manage campaign configuration' },
  { code: 'campaigns.execute', description: 'Schedule, start, pause, and cancel campaigns' },
  { code: 'campaigns.preview', description: 'Run non-persisted campaign previews' },
  { code: 'messages.read', description: 'Read organization outbound messages and status events' },
  { code: 'messages.manage', description: 'Manage outbound message execution' },
  { code: 'messages.retry', description: 'Retry outbound messages' },
  { code: 'messages.cancel', description: 'Cancel outbound messages' },
  { code: 'operations.read', description: 'Read operational execution visibility endpoints' },
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
    permissionCodes: [
      'auth.me.read',
      'auth.sessions.read',
      'auth.sessions.revoke',
      'devices.read',
      'devices.write',
      'devices.manage',
      'devices.heartbeat',
      'contacts.read',
      'contacts.write',
      'contacts.manage',
      'contact-lists.read',
      'contact-lists.write',
      'imports.contacts',
      'templates.read',
      'templates.write',
      'templates.manage',
      'templates.render',
      'campaigns.read',
      'campaigns.write',
      'campaigns.manage',
      'campaigns.execute',
      'campaigns.preview',
      'messages.read',
      'messages.manage',
      'messages.retry',
      'messages.cancel',
      'operations.read',
    ],
  },
  {
    code: 'org_member',
    name: 'Organization Member',
    description: 'Read-only access to own profile and sessions',
    scope: 'ORGANIZATION',
    isSystemRole: true,
    permissionCodes: [
      'auth.me.read',
      'auth.sessions.read',
      'devices.read',
      'contacts.read',
      'contact-lists.read',
      'templates.read',
      'templates.render',
      'campaigns.read',
      'campaigns.preview',
      'messages.read',
    ],
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
