import { createApp } from '@server/app';
import type { AuthHost } from '@server/auth';
import { createTestClient, mockServices } from '@server/test-services';
import { describe, expect, it, vi } from 'vite-plus/test';

function setup(auth?: AuthHost) {
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
    const auth = {
      handler: vi.fn().mockResolvedValue(Response.json({ success: true })),
      api: { getSession: vi.fn().mockResolvedValue({ user }) },
    };
    const { app, client } = setup(auth);
    expect(
      (await app.request('/api/auth/sign-in/anonymous', { method: 'POST', body: '{}' })).status,
    ).toBe(200);
    expect(auth.handler).toHaveBeenCalledOnce();
    expect(await client.session.current()).toEqual(user);
    expect(auth.api.getSession.mock.calls[0][0].headers.get('cookie')).toBe('signed-test-cookie');
  });
  it('keeps upstream failures separate from an unauthenticated session', async () => {
    const auth = {
      handler: vi.fn().mockRejectedValue(new Error('offline')),
      api: { getSession: vi.fn().mockRejectedValue(new Error('offline')) },
    };
    const { app, client } = setup(auth);
    expect((await app.request('/api/auth/get-session')).status).toBe(500);
    await expect(client.session.current()).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });
});
