import type { AppRouterClient, AppServices } from '@movies/api/router';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createApp } from '@server/app';
import type { AuthGateway } from '@server/auth-gateway';
import { describe, expect, it, vi } from 'vitest';

function setup(auth?: AuthGateway) {
  const services: AppServices = {
    home: { list: vi.fn(), trending: vi.fn() },
    catalog: { details: vi.fn(), trailer: vi.fn(), providers: vi.fn(), related: vi.fn() },
    discovery: { list: vi.fn(), options: vi.fn() },
    search: { list: vi.fn() },
    person: { details: vi.fn(), credits: vi.fn() },
  };
  const app = createApp(services, undefined, [], auth);
  const client: AppRouterClient = createORPCClient(
    new RPCLink({
      url: 'http://localhost/rpc',
      headers: { Cookie: 'signed-test-cookie' },
      fetch: async (request) => app.request(request),
    }),
  );
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
      handle: vi.fn().mockResolvedValue(Response.json({ success: true })),
      current: vi.fn().mockResolvedValue(user),
    };
    const { app, client } = setup(auth);
    expect(
      (await app.request('/api/auth/sign-in/anonymous', { method: 'POST', body: '{}' })).status,
    ).toBe(200);
    expect(auth.handle).toHaveBeenCalledOnce();
    expect(await client.session.current()).toEqual(user);
    expect(auth.current.mock.calls[0][0].get('cookie')).toBe('signed-test-cookie');
  });
  it('keeps upstream failures separate from an unauthenticated session', async () => {
    const auth = {
      handle: vi.fn().mockRejectedValue(new Error('offline')),
      current: vi.fn().mockRejectedValue(new Error('offline')),
    };
    const { app, client } = setup(auth);
    expect((await app.request('/api/auth/get-session')).status).toBe(502);
    await expect(client.session.current()).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });
});
