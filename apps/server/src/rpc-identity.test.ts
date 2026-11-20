import { createApp } from '@server/app';
import { mockAuth } from '@server/test-auth';
import { createTestClient, mockServices } from '@server/test-services';
import { expect, it, vi } from 'vite-plus/test';

it('derives RPC ownership from Better Auth and does not consult ingress assertions', async () => {
  const user = {
    id: 'owner',
    name: 'Owner',
    email: 'owner@example.com',
    image: null,
    isAnonymous: true,
  };
  const auth = mockAuth(user);
  const services = mockServices();
  vi.mocked(services.preferences.region).mockResolvedValue({ region: 'SE' });
  const clientIp = vi.fn(() => {
    throw new Error('Public ingress unavailable');
  });
  const app = createApp(services, { auth, clientIp });
  const client = createTestClient(app, {
    cookie: 'session',
    'x-user-id': 'victim',
    'x-movies-auth-client-ip': 'forged',
  });
  expect(await client.preferences.region()).toEqual({ region: 'SE' });
  expect(services.preferences.region).toHaveBeenCalledWith('owner');
  expect(clientIp).not.toHaveBeenCalled();
  expect(auth.api.getSession).toHaveBeenCalledWith({
    headers: expect.any(Headers),
    query: { disableCookieCache: true },
  });
});

it('does not resolve sessions or ingress IPs for public catalog reads', async () => {
  const auth = mockAuth();
  const services = mockServices();
  vi.mocked(services.home.list).mockResolvedValue([]);
  const clientIp = vi.fn();
  const client = createTestClient(createApp(services, { auth, clientIp }));
  expect(await client.home.list({ category: 'popular-tv' })).toEqual([]);
  expect(auth.api.getSession).not.toHaveBeenCalled();
  expect(clientIp).not.toHaveBeenCalled();
});

it('cannot execute a cookie-bearing mutation over GET', async () => {
  const services = mockServices();
  const app = createApp(services, { auth: mockAuth() });
  const response = await app.request(
    '/rpc/preferences/setRegion?data=' + encodeURIComponent('{"json":{"region":"US"}}'),
    { headers: { cookie: 'session' } },
  );
  expect(response.status).toBe(404);
  expect(services.preferences.setRegion).not.toHaveBeenCalled();
});
