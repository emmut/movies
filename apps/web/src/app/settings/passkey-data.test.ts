import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/auth-server-client', () => ({
  serverAuthClient: { passkey: { listUserPasskeys: vi.fn() } },
}));
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers({ cookie: 'a=b' })) }));

import { serverAuthClient } from '@/lib/auth-server-client';

import { getUserPasskeys } from './passkey-data';

const listPasskeys = vi.mocked(serverAuthClient.passkey.listUserPasskeys);

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('getUserPasskeys', () => {
  it('returns only the fields the settings page shows', async () => {
    const createdAt = new Date('2026-03-05T00:00:00Z');
    listPasskeys.mockResolvedValue({
      data: [
        {
          id: 'pk-1',
          name: 'Laptop',
          publicKey: 'secret-ish',
          credentialID: 'cred-1',
          userId: 'user-1',
          counter: 3,
          deviceType: 'multiDevice',
          backedUp: true,
          transports: 'internal',
          createdAt,
          aaguid: null,
        },
        {
          id: 'pk-2',
          publicKey: 'other',
          credentialID: 'cred-2',
          userId: 'user-1',
          counter: 0,
          deviceType: 'singleDevice',
          backedUp: false,
          createdAt,
        },
      ],
    } as never);

    await expect(getUserPasskeys()).resolves.toEqual([
      { id: 'pk-1', name: 'Laptop', deviceType: 'multiDevice', createdAt },
      { id: 'pk-2', name: null, deviceType: 'singleDevice', createdAt },
    ]);
    expect(listPasskeys).toHaveBeenCalledWith({ fetchOptions: { headers: expect.any(Headers) } });
  });

  it('returns an empty list when the lookup fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    listPasskeys.mockRejectedValue(new Error('db down'));

    await expect(getUserPasskeys()).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalledOnce();
  });
});
