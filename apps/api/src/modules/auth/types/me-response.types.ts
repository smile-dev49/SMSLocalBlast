import type {
  OrganizationStatus,
  MembershipStatus,
  RoleScope,
  UserGlobalStatus,
} from '@prisma/client';

export interface MeResponse {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly globalStatus: UserGlobalStatus;
    readonly emailVerifiedAt: Date | null;
    readonly lastLoginAt: Date | null;
  };
  readonly organization: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly status: OrganizationStatus;
  };
  readonly membership: {
    readonly id: string;
    readonly status: MembershipStatus;
    readonly joinedAt: Date;
  };
  readonly role: {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly scope: RoleScope;
    readonly isSystemRole: boolean;
  };
  readonly permissions: readonly string[];
}
