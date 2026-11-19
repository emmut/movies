import { AUTH_CLIENT_IP_HEADER, authProxyHeaders } from '@movies/auth/proxy';
import { createApp } from '@server/app';
import { authRequest, currentUser } from '@server/auth';
import { createTestClient, mockServices } from '@server/test-services';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { anonymous } from 'better-auth/plugins';
import { expect, it, vi } from 'vite-plus/test';

it('authenticates, authorizes and revokes through the local Better Auth instance despite a cached cookie', async () => {
  const auth = betterAuth({
    baseURL: 'http://localhost:3000',
    secret: 'a-fixture-secret-of-at-least-32-characters',
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    plugins: [anonymous()],
    session: { cookieCache: { enabled: true, maxAge: 300 } },
  });
  const services = mockServices();
  vi.mocked(services.preferences.region).mockResolvedValue({ region: 'SE' });
  const app = createApp(services, { auth });
  const response = await app.request('/api/auth/sign-in/anonymous', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
    body: '{}',
  });
  expect(response.status).toBe(200);
  const cookie = response.headers
    .getSetCookie()
    .map((entry) => entry.split(';')[0])
    .join('; ');
  expect(cookie).toContain('better-auth.session_data=');
  const client = createTestClient(app, { cookie });
  const user = await client.session.current();
  expect(user?.isAnonymous).toBe(true);
  expect(Object.keys(user!)).toEqual(['id', 'name', 'email', 'image', 'isAnonymous']);
  await client.preferences.region();
  expect(services.preferences.region).toHaveBeenCalledWith(user!.id);
  expect(
    (
      await app.request('/api/auth/sign-out', {
        method: 'POST',
        headers: { cookie, origin: 'http://localhost:3000', 'content-type': 'application/json' },
        body: '{}',
      })
    ).status,
  ).toBe(200);
  expect(await client.session.current()).toBeNull();
  await expect(client.preferences.region()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  expect(services.preferences.region).toHaveBeenCalledTimes(1);
});

it('uses Better Auth session validation without independent expiry or token parsing', async () => {
  const getSession = vi.fn().mockResolvedValue(null);
  expect(
    await currentUser(
      { handler: vi.fn(), api: { getSession } },
      new Headers({ cookie: 'invalid' }),
    ),
  ).toBeNull();
  expect(getSession).toHaveBeenCalledWith({
    headers: expect.any(Headers),
    query: { disableCookieCache: true },
  });
});

it('strips unsigned client IP metadata and binds proxy assertions to path/method', () => {
  const secret = 'a-fixture-secret-of-at-least-32-characters';
  const request = new Request('http://api.test/api/auth/get-session', {
    headers: {
      [AUTH_CLIENT_IP_HEADER]: 'forged',
      'x-real-ip': 'forged',
      'x-forwarded-for': 'forged',
    },
  });
  const direct = authRequest(request, secret, () => '203.0.113.5');
  expect(direct.headers.get(AUTH_CLIENT_IP_HEADER)).toBe('203.0.113.5');
  expect(direct.headers.has('x-real-ip')).toBe(false);
  expect(direct.headers.has('x-forwarded-for')).toBe(false);
  const signed = authProxyHeaders(secret, '203.0.113.6', 'GET', '/api/auth/get-session');
  expect(
    authRequest(new Request(request, { headers: signed }), secret, () => '203.0.113.5').headers.get(
      AUTH_CLIENT_IP_HEADER,
    ),
  ).toBe('203.0.113.6');
  expect(() =>
    authRequest(new Request('http://api.test/api/auth/sign-out', { headers: signed }), secret),
  ).toThrow('Invalid authentication proxy metadata');
});

it('does not require public ingress metadata for a verified web proxy assertion', () => {
  const secret = 'a-fixture-secret-of-at-least-32-characters';
  const headers = authProxyHeaders(secret, '203.0.113.6', 'GET', '/api/auth/get-session');
  const ingress = vi.fn(() => {
    throw new Error('Public ingress unavailable');
  });
  const request = authRequest(
    new Request('http://api.internal/api/auth/get-session', { headers }),
    secret,
    ingress,
  );
  expect(request.headers.get(AUTH_CLIENT_IP_HEADER)).toBe('203.0.113.6');
  expect(ingress).not.toHaveBeenCalled();
});
