import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const client = vi.hoisted(() => ({
  useSession: vi.fn(),
  signIn: { passkey: vi.fn() },
  passkey: { addPasskey: vi.fn(), updatePasskey: vi.fn(), deletePasskey: vi.fn() },
}));

vi.mock('better-auth/react', () => ({ createAuthClient: () => client }));
vi.mock('@/env', () => ({ ENV: { NEXT_PUBLIC_BASE_URL: 'http://localhost:3000' } }));
vi.mock('@/lib/pending-greet', () => ({ markPendingGreet: vi.fn(), clearPendingGreet: vi.fn() }));

import { addPasskey, deletePasskey, renamePasskey, signInPasskey } from '@/lib/auth-client';
import { clearPendingGreet, markPendingGreet } from '@/lib/pending-greet';

const cancelled = {
  code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
  cause: new DOMException('dismissed', 'NotAllowedError'),
};
const serverError = { code: 'INTERNAL_SERVER_ERROR', status: 500 };

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('passkey auth client', () => {
  const cases = [
    {
      name: 'addPasskey',
      mock: client.passkey.addPasskey,
      run: () => addPasskey('Laptop'),
      args: [{ name: 'Laptop' }],
    },
    {
      name: 'renamePasskey',
      mock: client.passkey.updatePasskey,
      run: () => renamePasskey('pk-1', 'Phone'),
      args: [{ id: 'pk-1', name: 'Phone' }],
    },
    {
      name: 'deletePasskey',
      mock: client.passkey.deletePasskey,
      run: () => deletePasskey('pk-1'),
      args: [{ id: 'pk-1' }],
    },
  ];

  describe.each(cases)('$name', ({ mock, run, args }) => {
    it('succeeds when Better Auth returns data', async () => {
      mock.mockResolvedValue({ data: { status: true }, error: null });

      await expect(run()).resolves.toEqual({ ok: true });
      expect(mock).toHaveBeenCalledWith(...args);
    });

    it('reports a returned error as a logged failure', async () => {
      mock.mockResolvedValue({ data: null, error: serverError });

      await expect(run()).resolves.toEqual({ ok: false, reason: 'failed' });
      expect(console.error).toHaveBeenCalledOnce();
    });

    it('reports a thrown error as a logged failure', async () => {
      mock.mockRejectedValue(new Error('network down'));

      await expect(run()).resolves.toEqual({ ok: false, reason: 'failed' });
      expect(console.error).toHaveBeenCalledOnce();
    });
  });

  it('reports an authenticator that already holds a passkey', async () => {
    client.passkey.addPasskey.mockResolvedValue({
      data: null,
      error: { code: 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED' },
    });

    await expect(addPasskey('Laptop')).resolves.toEqual({
      ok: false,
      reason: 'already-registered',
    });
  });

  describe('signInPasskey', () => {
    it('signs in without a username and wires the greeting hooks', async () => {
      client.signIn.passkey.mockResolvedValue({ data: { session: {} }, error: null });

      await expect(signInPasskey()).resolves.toEqual({ ok: true });

      const [opts, fetchOptions] = client.signIn.passkey.mock.calls[0];
      expect(opts).toBeUndefined();
      fetchOptions.onRequest();
      expect(markPendingGreet).toHaveBeenCalled();
      fetchOptions.onError();
      expect(clearPendingGreet).toHaveBeenCalled();
    });

    it('reports a dismissed prompt as cancelled without logging', async () => {
      client.signIn.passkey.mockResolvedValue({ data: null, error: cancelled });

      await expect(signInPasskey()).resolves.toEqual({ ok: false, reason: 'cancelled' });
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
