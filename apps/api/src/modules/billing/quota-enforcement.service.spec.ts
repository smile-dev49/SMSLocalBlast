import { EntitlementsService } from './entitlements.service';
import { QuotaEnforcementService } from './quota-enforcement.service';
import type { UsageCountersService } from './usage-counters.service';

describe('QuotaEnforcementService', () => {
  it('allows below numeric limit and blocks at limit', async () => {
    const entitlements = {
      resolveForOrganization: jest.fn().mockResolvedValue({ 'devices.max': 2 }),
    } as unknown as EntitlementsService;
    const usage = {} as UsageCountersService;
    const auditCreate = jest.fn().mockResolvedValue({});
    const prisma = { auditLog: { create: auditCreate } };
    const service = new QuotaEnforcementService(entitlements, usage, prisma as never);

    await expect(
      service.assertBelowLimit({
        organizationId: 'org_1',
        entitlementCode: 'devices.max',
        currentValue: 1,
      }),
    ).resolves.toBeUndefined();

    await expect(
      service.assertBelowLimit({
        organizationId: 'org_1',
        entitlementCode: 'devices.max',
        currentValue: 2,
      }),
    ).rejects.toThrow('Quota exceeded');
    expect(auditCreate).toHaveBeenCalled();
  });
});
