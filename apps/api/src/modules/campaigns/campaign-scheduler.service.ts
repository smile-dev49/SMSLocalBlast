import { Injectable } from '@nestjs/common';
import { CampaignValidationException } from './exceptions/campaigns.exceptions';

@Injectable()
export class CampaignSchedulerService {
  assertScheduledAtInFuture(scheduledAt: Date, now: Date = new Date()): void {
    if (scheduledAt.getTime() <= now.getTime()) {
      throw new CampaignValidationException('scheduledAt must be in the future');
    }
  }
}
