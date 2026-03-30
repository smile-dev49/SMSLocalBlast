export interface AuthPrincipal {
  readonly userId: string;
  readonly sessionId: string;
  /**
   * Organization context for org-scoped authorization.
   * `null` for future platform-scoped admin tokens.
   */
  readonly organizationId: string | null;
  readonly membershipId: string | null;
  readonly roleCode: string | null;
  readonly roleScope: 'SYSTEM' | 'ORGANIZATION' | null;
  /**
   * Resolved permission codes for RBAC checks at request time.
   * Kept in-memory to support both role and permission guard foundations.
   */
  readonly permissions: readonly string[];
}
