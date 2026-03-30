/**
 * JWT access claims.
 * These are the fields stored inside the signed access token.
 */
export interface JwtAccessClaims {
  readonly sub: string; // user id
  readonly email: string;
  readonly sessionId: string;

  /**
   * Organization + membership context for org-scoped authorization.
   * Nullable for future platform-scoped admin/system tokens.
   */
  readonly organizationId: string | null;
  readonly membershipId: string | null;
  readonly roleCode: string | null;

  /**
   * Role scope for auth guard / admin future enhancements.
   */
  readonly roleScope: 'SYSTEM' | 'ORGANIZATION' | null;
}
