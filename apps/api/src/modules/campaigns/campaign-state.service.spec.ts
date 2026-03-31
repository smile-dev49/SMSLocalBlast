import { CampaignStateService } from './campaign-state.service';
import { CampaignInvalidStateException } from './exceptions/campaigns.exceptions';

describe('CampaignStateService', () => {
  const svc = new CampaignStateService();

  it('allows schedule from DRAFT or PAUSED only', () => {
    expect(() => {
      svc.assertScheduleAllowed('DRAFT');
    }).not.toThrow();
    expect(() => {
      svc.assertScheduleAllowed('PAUSED');
    }).not.toThrow();
    expect(() => {
      svc.assertScheduleAllowed('SCHEDULED');
    }).toThrow(CampaignInvalidStateException);
  });

  it('allows start from DRAFT, SCHEDULED, PAUSED', () => {
    expect(() => {
      svc.assertStartAllowed('DRAFT');
    }).not.toThrow();
    expect(() => {
      svc.assertStartAllowed('SCHEDULED');
    }).not.toThrow();
    expect(() => {
      svc.assertStartAllowed('PAUSED');
    }).not.toThrow();
    expect(() => {
      svc.assertStartAllowed('PROCESSING');
    }).toThrow(CampaignInvalidStateException);
  });

  it('allows pause from SCHEDULED or PROCESSING', () => {
    expect(() => {
      svc.assertPauseAllowed('SCHEDULED');
    }).not.toThrow();
    expect(() => {
      svc.assertPauseAllowed('PROCESSING');
    }).not.toThrow();
    expect(() => {
      svc.assertPauseAllowed('DRAFT');
    }).toThrow(CampaignInvalidStateException);
  });

  it('rejects cancel when already terminal', () => {
    expect(() => {
      svc.assertCancelAllowed('COMPLETED');
    }).toThrow(CampaignInvalidStateException);
    expect(() => {
      svc.assertCancelAllowed('DRAFT');
    }).not.toThrow();
  });
});
