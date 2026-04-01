import { BillingWebhookService } from './billing-webhook.service';

describe('BillingWebhookService', () => {
  it('is idempotent for processed events', async () => {
    const prisma = {
      billingEventLog: {
        findUnique: jest.fn().mockResolvedValue({ id: 'evt_log_1', processedAt: new Date() }),
      },
    };
    const service = new BillingWebhookService(prisma as never);
    await expect(
      service.processStripeEvent({
        id: 'evt_123',
        type: 'customer.subscription.updated',
        data: { object: {} },
      } as never),
    ).resolves.toBeUndefined();
  });
});
