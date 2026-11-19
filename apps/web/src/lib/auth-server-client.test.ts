import { afterEach, expect, it, vi } from 'vite-plus/test';

import { serverAuthClient } from './auth-server-client';

const fetcher = vi.fn<typeof fetch>();
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('uses the official client to read sessions from Hono with the current cookie', async () => {
  fetcher.mockResolvedValue(
    Response.json({
      user: { id: 'owner', name: 'Owner', email: 'owner@example.com', isAnonymous: true },
      session: { id: 's1', expiresAt: '2099-01-01T00:00:00.000Z' },
    }),
  );
  vi.stubGlobal('fetch', fetcher);
  const { data, error } = await serverAuthClient.getSession({
    fetchOptions: { headers: new Headers({ cookie: 'session=owner', 'x-user-id': 'forged' }) },
  });
  expect(error).toBeNull();
  expect(data?.user.id).toBe('owner');
  const [request] = fetcher.mock.calls[0];
  expect((request as Request).url).toBe('http://localhost:3001/api/auth/get-session');
  const options = fetcher.mock.calls[0][1];
  expect(new Headers(options?.headers).get('cookie')).toBe('session=owner');
  expect(new Headers(options?.headers).has('x-user-id')).toBe(false);
  expect((request as Request).cache).toBe('no-store');
});

it('returns Better Auth errors rather than treating a failed host as signed out', async () => {
  fetcher.mockResolvedValue(Response.json({ message: 'unavailable' }, { status: 503 }));
  vi.stubGlobal('fetch', fetcher);
  const { data, error } = await serverAuthClient.getSession();
  expect(data).toBeNull();
  expect(error?.status).toBe(503);
});
