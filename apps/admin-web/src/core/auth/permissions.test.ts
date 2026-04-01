import { describe, expect, it } from 'vitest';

import {
  ADMIN_NAV_ITEMS,
  filterNavForPermissions,
  hasPermission,
  PERMISSION,
} from '@/core/auth/permissions';

describe('hasPermission', () => {
  it('returns false for undefined permissions', () => {
    expect(hasPermission(undefined, 'devices.read')).toBe(false);
  });

  it('returns true when code is present', () => {
    expect(hasPermission(['devices.read', 'campaigns.read'], 'devices.read')).toBe(true);
  });
});

describe('filterNavForPermissions', () => {
  it('always includes dashboard and settings', () => {
    const nav = filterNavForPermissions(ADMIN_NAV_ITEMS, []);
    expect(nav.map((i) => i.href)).toEqual(['/dashboard', '/settings']);
  });

  it('includes operations when operations.read granted', () => {
    const nav = filterNavForPermissions(ADMIN_NAV_ITEMS, [PERMISSION.operationsRead]);
    expect(nav.some((i) => i.href === '/operations')).toBe(true);
  });

  it('hides operations without permission', () => {
    const nav = filterNavForPermissions(ADMIN_NAV_ITEMS, ['devices.read']);
    expect(nav.some((i) => i.href === '/operations')).toBe(false);
  });

  it('includes billing when billing.read granted', () => {
    const nav = filterNavForPermissions(ADMIN_NAV_ITEMS, [PERMISSION.billingRead]);
    expect(nav.some((i) => i.href === '/billing')).toBe(true);
  });
});
