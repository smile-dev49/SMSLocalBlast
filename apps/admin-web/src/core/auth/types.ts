export interface MeResponse {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly globalStatus: string;
    readonly emailVerifiedAt: string | null;
    readonly lastLoginAt: string | null;
  };
  readonly organization: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly status: string;
  };
  readonly membership: {
    readonly id: string;
    readonly status: string;
    readonly joinedAt: string;
  };
  readonly role: {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly scope: string;
    readonly isSystemRole: boolean;
  };
  readonly permissions: readonly string[];
}

export interface SafeSession {
  readonly id: string;
  readonly userId: string;
  readonly organizationId: string | null;
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
  readonly deviceFingerprint: string | null;
  readonly isRevoked: boolean;
  readonly revokedAt: string | null;
  readonly expiresAt: string;
  readonly lastUsedAt: string | null;
  readonly createdAt: string;
}
