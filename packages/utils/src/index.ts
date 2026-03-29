import type { TenantContext } from '@sms-localblast/types';

/** Example shared helper — replace with real tenancy utilities in later work. */
export function describeTenant(ctx: TenantContext): string {
  return `organization:${ctx.organizationId}`;
}
