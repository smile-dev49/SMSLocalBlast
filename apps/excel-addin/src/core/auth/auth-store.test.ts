import { describe, expect, it } from 'vitest';

import { useAuthStore } from '@/core/auth/auth-store';

describe('auth store', () => {
  it('sets and clears tokens', () => {
    const state = useAuthStore.getState();
    state.setTokens('a', 'r');
    expect(useAuthStore.getState().accessToken).toBe('a');
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
