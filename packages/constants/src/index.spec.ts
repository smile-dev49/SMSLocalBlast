import { describe, expect, it } from 'vitest';
import { API_HEALTH_PATH } from './index';

describe('@sms-localblast/constants', () => {
  it('exports stable health path', () => {
    expect(API_HEALTH_PATH).toBe('/health');
  });
});
