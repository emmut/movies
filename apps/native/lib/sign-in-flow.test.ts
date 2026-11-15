import { createSignInFlow } from '@native/lib/sign-in-flow';
import { describe, expect, it, vi } from 'vite-plus/test';

describe('native sign-in completion', () => {
  it.each(['discord', 'github', 'anonymous', 'passkey'] as const)(
    'verifies the returned session after %s',
    async (method) => {
      const signIn = vi.fn().mockResolvedValue({ error: null });
      const current = vi.fn().mockResolvedValue({ isAnonymous: method === 'anonymous' });
      expect(await createSignInFlow({ signIn, current })(method, '/discover')).toEqual({
        status: 'signed-in',
      });
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
      expect(await flow(method, '/')).toEqual({
        status: 'failed',
        message: expect.stringContaining('cancelled'),
      });
    },
  );
  it('rejects a missing session even when the browser reports no error', async () => {
    const flow = createSignInFlow({
      signIn: async () => ({ error: null }),
      current: async () => null,
    });
    expect(await flow('discord', '/')).toEqual({
      status: 'failed',
      message: expect.stringContaining('cancelled'),
    });
  });
  it('keeps an auth error separate from network failure and does not claim a session', async () => {
    const current = vi.fn();
    const signIn = vi
      .fn()
      .mockResolvedValueOnce({ error: { message: 'denied' } })
      .mockRejectedValueOnce(new Error('offline'));
    const flow = createSignInFlow({ signIn, current });
    expect(await flow('anonymous', '/')).toEqual({
      status: 'failed',
      message: 'Couldn’t sign in. Please try again.',
    });
    expect(await flow('anonymous', '/')).toEqual({
      status: 'failed',
      message: expect.stringContaining('Check your connection'),
    });
    expect(current).not.toHaveBeenCalled();
  });
  it.each([
    ['PASSKEY_CANCELLED', { status: 'dismissed' }],
    [
      'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
      { status: 'failed', message: 'Couldn’t sign in. Please try again.' },
    ],
    [
      'PASSKEY_NO_CREDENTIALS',
      { status: 'failed', message: 'No passkey for Movies was found on this device.' },
    ],
    ['PASSKEY_FAILED', { status: 'failed', message: 'Couldn’t sign in. Please try again.' }],
  ])('maps a passkey %s error without checking the session', async (code, outcome) => {
    const current = vi.fn();
    const flow = createSignInFlow({ signIn: async () => ({ error: { code } }), current });
    expect(await flow('passkey', '/')).toEqual(outcome);
    expect(current).not.toHaveBeenCalled();
  });
  it('never treats a social error as a dismissed passkey prompt', async () => {
    const flow = createSignInFlow({
      signIn: async () => ({ error: { code: 'PASSKEY_CANCELLED' } }),
      current: async () => null,
    });
    expect(await flow('github', '/')).toEqual({
      status: 'failed',
      message: 'Couldn’t sign in. Please try again.',
    });
  });
});

it.each(['NotAllowedError', 'SecurityError'])(
  'distinguishes the browser cause %s before checking session state',
  async (name) => {
    const current = vi.fn();
    const flow = createSignInFlow({
      signIn: async () => ({
        error: {
          code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
          cause: new DOMException('prompt failed', name),
        },
      }),
      current,
    });
    const result = await flow('passkey', '/');
    expect(result.status).toBe(name === 'NotAllowedError' ? 'dismissed' : 'failed');
    expect(current).not.toHaveBeenCalled();
  },
);
