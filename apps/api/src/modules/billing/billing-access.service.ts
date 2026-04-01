import { HttpStatus, Injectable } from '@nestjs/common';
import type { SubscriptionStatus } from '@prisma/client';
import { ApiErrorCodes } from '../../common/constants/http.constants';
import { AppHttpException } from '../../common/exceptions/app-http.exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/** Central subscription gate for monetized actions (messaging, etc.). */
@Injectable()
export class BillingAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Blocks outbound generation / sending when the org subscription is in a hard-off state.
   * - `PAST_DUE`: still allowed (grace — monitor via Stripe webhooks).
   * - `UNPAID`, `CANCELLED`, `INCOMPLETE_EXPIRED`, `INCOMPLETE`, `PAUSED`: blocked.
   */
  async assertOrganizationMayUseOutboundMessaging(organizationId: string): Promise<void> {
    const sub = await this.prisma.organizationSubscription.findUnique({
      where: { organizationId_provider: { organizationId, provider: 'STRIPE' } },
      select: { status: true },
    });
    if (!sub) return;
    const status: SubscriptionStatus = sub.status;
    const blocked: ReadonlySet<SubscriptionStatus> = new Set([
      'UNPAID',
      'CANCELLED',
      'INCOMPLETE_EXPIRED',
      'INCOMPLETE',
      'PAUSED',
    ]);
    if (blocked.has(status)) {
      throw new AppHttpException(
        ApiErrorCodes.FORBIDDEN,
        'Outbound messaging is disabled for this subscription state',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
