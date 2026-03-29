/**
 * Cross-cutting domain types shared across SMS LocalBlast apps.
 * Business modules will extend these primitives; keep controllers and UI free of domain duplication.
 */

export type OrganizationId = string & { readonly __brand: 'OrganizationId' };

export interface TenantContext {
  readonly organizationId: OrganizationId;
}

export function createOrganizationId(value: string): OrganizationId {
  return value as OrganizationId;
}
