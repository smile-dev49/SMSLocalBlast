import { CampaignSchedulerService } from './campaign-scheduler.service';
import { CampaignValidationException } from './exceptions/campaigns.exceptions';

describe('CampaignSchedulerService', () => {
  const svc = new CampaignSchedulerService();

  it('requires scheduledAt in the future', () => {
    const now = new Date('2026-01-15T12:00:00.000Z');
    expect(() => {
      svc.assertScheduledAtInFuture(new Date('2026-01-15T11:00:00.000Z'), now);
    }).toThrow(CampaignValidationException);
    expect(() => {
      svc.assertScheduledAtInFuture(new Date('2026-01-15T13:00:00.000Z'), now);
    }).not.toThrow();
  });
});
