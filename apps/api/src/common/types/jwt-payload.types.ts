/**
 * JWT access payload (Prompt 3). Shape is intentionally minimal for now.
 */
export interface JwtAccessPayload {
  readonly sub: string;
  readonly email: string;
  readonly organizationId?: string;
}
