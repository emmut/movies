import { createSignInFlow } from '@native/lib/sign-in-flow';
import { describe, expect, it, vi } from 'vite-plus/test';

describe('native sign-in completion', () => {
  it.each(['discord', 'github', 'anonymous', 'passkey'] as const)(
    'verifies the returned session after %s',
    async (method) => {
      const signIn = vi.fn().mockResolvedValue({ error: null });
      const current = vi.fn().mockResolvedValue({ isAnonymous: method === 'anonymous' });
      expect(await createSignInFlow({ signIn, current })(method, '/discover')).toBeNull();
      expect(signIn).toHaveBeenCalledWith(method, '/discover');
      expect(current).toHaveBeenCalledOnce();
    },
  );
  it.each(['discord', 'github', 'passkey'] as const)(
    'does not claim an existing anonymous session completed %s authentication',
    async (method) => {
      const flow = createSignInFlow({
        signIn: async () => ({ error: null }),
        current: async () => ({ isAnonymous: true }),
      });
      expect(await flow(method, '/')).toContain('cancelled');
    },
  );
  it('rejects a missing session even when the browser reports no error', async () => {
    const flow = createSignInFlow({
      signIn: async () => ({ error: null }),
      current: async () => null,
    });
    expect(await flow('discord', '/')).toContain('cancelled');
  });
  it('keeps an auth error separate from network failure and does not claim a session', async () => {
    const current = vi.fn();
    const signIn = vi
      .fn()
      .mockResolvedValueOnce({ error: { message: 'denied' } })
      .mockRejectedValueOnce(new Error('offline'));
    const flow = createSignInFlow({ signIn, current });
    expect(await flow('anonymous', '/')).toBe('Couldn’t sign in. Please try again.');
    expect(await flow('anonymous', '/')).toContain('Check your connection');
    expect(current).not.toHaveBeenCalled();
  });
});
