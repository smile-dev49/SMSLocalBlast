import { describe, expect, it } from 'vitest';
import { createOrganizationId } from '@sms-localblast/types';
import { describeTenant } from './index';

describe('@sms-localblast/utils', () => {
  it('describeTenant includes organization id', () => {
    const ctx = { organizationId: createOrganizationId('org_1') };
    expect(describeTenant(ctx)).toContain('org_1');
  });
});
