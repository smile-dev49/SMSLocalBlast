/** Canonical permission codes used by the admin UI for gating actions and navigation. */
export const PERMISSION = {
  operationsRead: 'operations.read',
  devicesRead: 'devices.read',
  devicesManage: 'devices.manage',
  campaignsRead: 'campaigns.read',
  campaignsExecute: 'campaigns.execute',
  messagesRead: 'messages.read',
  messagesRetry: 'messages.retry',
  messagesCancel: 'messages.cancel',
  contactsRead: 'contacts.read',
  templatesRead: 'templates.read',
  authSessionsRead: 'auth.sessions.read',
  authSessionsRevoke: 'auth.sessions.revoke',
  authLogoutAll: 'auth.logout_all',
} as const;

/** Returns true if the permission list includes the required permission code. */
export function hasPermission(permissions: readonly string[] | undefined, code: string): boolean {
  return Boolean(permissions?.includes(code));
}

export interface NavItem {
  readonly href: string;
  readonly label: string;
  /** If set, item is hidden unless user has this permission. */
  readonly requiredPermission?: string;
}

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/devices', label: 'Devices', requiredPermission: PERMISSION.devicesRead },
  { href: '/campaigns', label: 'Campaigns', requiredPermission: PERMISSION.campaignsRead },
  { href: '/messages', label: 'Messages', requiredPermission: PERMISSION.messagesRead },
  { href: '/contacts', label: 'Contacts', requiredPermission: PERMISSION.contactsRead },
  { href: '/templates', label: 'Templates', requiredPermission: PERMISSION.templatesRead },
  { href: '/operations', label: 'Operations', requiredPermission: PERMISSION.operationsRead },
  { href: '/settings', label: 'Settings' },
] as const;

export function filterNavForPermissions(
  items: readonly NavItem[],
  permissions: readonly string[] | undefined,
): NavItem[] {
  return items.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(permissions, item.requiredPermission);
  });
}
