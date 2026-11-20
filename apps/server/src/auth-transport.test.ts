import type { Auth } from '@movies/auth';
import { createApp } from '@server/app';
import { createTestAuth, mockAuth } from '@server/test-auth';
import { createTestClient, mockServices } from '@server/test-services';
import { describe, expect, it, vi } from 'vite-plus/test';

function setup(auth?: Pick<Auth, 'handler' | 'api'>) {
  const services = mockServices();
  const app = createApp(services, { auth });
  const client = createTestClient(app, { Cookie: 'signed-test-cookie' });
  return { app, client };
}

describe('native authentication HTTP and RPC', () => {
  it('preserves public reads and reports auth configuration separately', async () => {
    const { app, client } = setup();
    expect((await app.request('/health')).status).toBe(200);
    expect((await app.request('/api/auth/get-session')).status).toBe(503);
    expect(await client.session.current()).toBeNull();
  });
  it('permits credentialed development CORS only for allowed origins', async () => {
    const { app } = setup();
    const response = await app.request('/api/auth/sign-in/anonymous', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:8083',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:8083');
    expect(response.headers.get('access-control-allow-credentials')).toBe('true');
    const rejected = await app.request('/api/auth/get-session', {
      headers: { Origin: 'https://evil.example' },
    });
    expect(rejected.headers.has('access-control-allow-origin')).toBe(false);
  });
  it('runs the canonical auth handler and reads identity from the current request cookie', async () => {
    const user = {
      id: 'verified-user',
      name: 'User',
      email: 'user@example.com',
      image: null,
      isAnonymous: true,
    };
    const auth = mockAuth(user);
    const { app, client } = setup(auth);
    expect(
      (await app.request('/api/auth/sign-in/anonymous', { method: 'POST', body: '{}' })).status,
    ).toBe(200);
    expect(auth.handler).toHaveBeenCalledOnce();
    expect(await client.session.current()).toEqual(user);
    expect(
      new Headers(vi.mocked(auth.api.getSession).mock.calls[0][0]?.headers).get('cookie'),
    ).toBe('signed-test-cookie');
  });
  it('keeps upstream failures separate from an unauthenticated session', async () => {
    const auth = mockAuth();
    vi.mocked(auth.handler).mockRejectedValue(new Error('offline'));
    vi.mocked(auth.api.getSession).mockRejectedValue(new Error('offline'));
    const { app, client } = setup(auth);
    expect((await app.request('/api/auth/get-session')).status).toBe(500);
    await expect(client.session.current()).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });
});

it('authenticates, authorizes and revokes through the local Better Auth instance despite a cached cookie', async () => {
  const auth = createTestAuth({
    baseURL: 'http://localhost:3000',
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
