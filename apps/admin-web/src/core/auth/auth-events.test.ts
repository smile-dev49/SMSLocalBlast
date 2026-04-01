import { describe, expect, it, vi } from 'vitest';

import { authEvents } from '@/core/auth/auth-events';

describe('authEvents', () => {
  it('notifies subscribers on unauthorized', () => {
    const fn = vi.fn();
    const unsub = authEvents.subscribeUnauthorized(fn);
    authEvents.emitUnauthorized();
    expect(fn).toHaveBeenCalledTimes(1);
    unsub();
    authEvents.emitUnauthorized();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
