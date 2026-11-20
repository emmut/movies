import { afterEach, expect, it, vi } from 'vite-plus/test';

import { GET, POST } from './route';

const fetcher = vi.fn<typeof fetch>();
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

it('forwards auth to Hono, preserving callback queries, redirects and multiple cookies', async () => {
  const response = new Response(null, { status: 302, headers: { location: 'movies://login' } });
  response.headers.append('set-cookie', 'session=one; HttpOnly; Path=/');
  response.headers.append('set-cookie', 'state=two; HttpOnly; Path=/');
  fetcher.mockResolvedValue(response);
  vi.stubGlobal('fetch', fetcher);
  const result = await GET(
    new Request('http://localhost:3000/api/auth/callback/github?code=test', {
      headers: { cookie: 'oauth-state=valid', 'x-user-id': 'forged' },
    }),
  );
  expect(String(fetcher.mock.calls[0][0])).toBe(
    'http://localhost:3001/api/auth/callback/github?code=test',
  );
  expect(fetcher.mock.calls[0][1]?.redirect).toBe('manual');
  const headers = new Headers(fetcher.mock.calls[0][1]?.headers);
  expect(headers.get('cookie')).toBe('oauth-state=valid');
  expect(headers.has('x-user-id')).toBe(false);
  expect(result.status).toBe(302);
  expect(result.headers.get('location')).toBe('movies://login');
  expect(result.headers.getSetCookie()).toHaveLength(2);
  expect(result.headers.get('cache-control')).toBe('no-store');
});

it('forwards browser origins and bodies for Better Auth CSRF checks, stripping caller IP metadata', async () => {
  fetcher.mockResolvedValue(new Response('denied', { status: 403 }));
  vi.stubGlobal('fetch', fetcher);
  const result = await POST(
    new Request('http://localhost:3000/api/auth/sign-out', {
      method: 'POST',
      headers: {
        origin: 'https://evil.example',
        'content-type': 'application/json',
        'x-real-ip': 'forged',
        'x-movies-auth-client-ip': 'forged',
      },
      body: '{}',
    }),
  );
  const options = fetcher.mock.calls[0][1];
  expect(new Headers(options?.headers).get('origin')).toBe('https://evil.example');
  expect(new Headers(options?.headers).has('x-real-ip')).toBe(false);
  expect(new Headers(options?.headers).has('x-movies-auth-client-ip')).toBe(false);
  expect(new TextDecoder().decode(options?.body as ArrayBuffer)).toBe('{}');
  expect(result.status).toBe(403);
});

it('fails when Hono is unavailable without executing authentication locally', async () => {
  fetcher.mockRejectedValue(new Error('offline'));
  vi.stubGlobal('fetch', fetcher);
  await expect(GET(new Request('http://localhost:3000/api/auth/get-session'))).rejects.toThrow(
    'offline',
  );
});
