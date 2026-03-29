import { describe, expect, it } from 'vitest';
import { createOrganizationId } from './index';

describe('@sms-localblast/types', () => {
  it('createOrganizationId returns branded id', () => {
    const id = createOrganizationId('org_123');
    expect(id).toBe('org_123');
  });
});
