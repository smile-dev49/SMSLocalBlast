import { Injectable } from '@nestjs/common';
import type { CampaignStatus } from '@prisma/client';
import { CampaignInvalidStateException } from './exceptions/campaigns.exceptions';

const terminalStatuses: readonly CampaignStatus[] = ['COMPLETED', 'CANCELLED', 'FAILED'];

@Injectable()
export class CampaignStateService {
  assertScheduleAllowed(current: CampaignStatus): void {
    if (current !== 'DRAFT' && current !== 'PAUSED') {
      throw new CampaignInvalidStateException(
        'Campaign can only be scheduled from DRAFT or PAUSED',
      );
    }
  }

  assertStartAllowed(current: CampaignStatus): void {
    if (!['DRAFT', 'SCHEDULED', 'PAUSED'].includes(current)) {
      throw new CampaignInvalidStateException(
        'Campaign can only be started from DRAFT, SCHEDULED, or PAUSED',
      );
    }
  }

  assertPauseAllowed(current: CampaignStatus): void {
    if (current !== 'SCHEDULED' && current !== 'PROCESSING') {
      throw new CampaignInvalidStateException(
        'Campaign can only be paused from SCHEDULED or PROCESSING',
      );
    }
  }

  assertCancelAllowed(current: CampaignStatus): void {
    if (terminalStatuses.includes(current)) {
      throw new CampaignInvalidStateException(
        'Campaign is already in a terminal state and cannot be cancelled',
      );
    }
  }

  nextStatusSchedule(): CampaignStatus {
    return 'SCHEDULED';
  }

  nextStatusStart(): CampaignStatus {
    return 'PROCESSING';
  }

  nextStatusPause(): CampaignStatus {
    return 'PAUSED';
  }

  nextStatusCancel(): CampaignStatus {
    return 'CANCELLED';
  }
}
