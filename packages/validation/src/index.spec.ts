import { describe, expect, it } from 'vitest';
import { parseNodeEnv } from './index';

describe('@sms-localblast/validation', () => {
  it('defaults undefined to development', () => {
    expect(parseNodeEnv(undefined)).toBe('development');
  });
});
