import { authProxyHeaders } from '@movies/auth/proxy';
import { createApp } from '@server/app';
import { mockServices } from '@server/test-services';
import { describe, expect, it, vi } from 'vite-plus/test';

const secret = 'a-fixture-secret-at-least-32-characters';
function setup() {
  const services = mockServices();
  vi.mocked(services.preferences.region).mockResolvedValue({ region: 'SE' });
  const auth = { handle: vi.fn(), current: vi.fn().mockResolvedValue({ id: 'owner' }) };
  const app = createApp(services, { auth, rpcProxySecret: secret, clientIp: () => '198.51.100.1' });
  return { app, auth, services };
}
function request(headers: Headers) {
  headers.set('cookie', 'session');
  headers.set('content-type', 'application/json');
  return { method: 'POST', headers, body: '{}' };
}
describe('RPC ingress identity', () => {
  it('uses the signed browser IP for canonical session verification', async () => {
    const { app, auth } = setup();
    const headers = authProxyHeaders(secret, '203.0.113.10', 'POST', '/rpc/preferences/region');
    expect((await app.request('/rpc/preferences/region', request(headers))).status).toBe(200);
    expect(auth.current).toHaveBeenCalledWith(expect.any(Headers), '203.0.113.10');
  });
  it('keeps direct native requests on trusted API ingress identity, ignoring unsigned identity fields', async () => {
    const { app, auth } = setup();
    const headers = new Headers({
      'x-movies-auth-client-ip': '203.0.113.99',
      'x-user-id': 'victim',
    });
    expect((await app.request('/rpc/preferences/region', request(headers))).status).toBe(200);
    expect(auth.current).toHaveBeenCalledWith(expect.any(Headers), '198.51.100.1');
  });
  it('rejects forged and path-replayed assertions before verifying a session or executing services', async () => {
    for (const [key, path] of [
      [secret, '/rpc/session/current'],
      ['forged-key', '/rpc/preferences/region'],
    ]) {
      const { app, auth, services } = setup();
      const headers = authProxyHeaders(key, '203.0.113.10', 'POST', path);
      expect((await app.request('/rpc/preferences/region', request(headers))).status).toBe(500);
      expect(auth.current).not.toHaveBeenCalled();
      expect(services.preferences.region).not.toHaveBeenCalled();
    }
  });
  it('cannot execute a cookie-bearing mutation over GET', async () => {
    const { app, services } = setup();
    const response = await app.request(
      '/rpc/preferences/setRegion?data=' + encodeURIComponent('{"json":{"region":"US"}}'),
      { headers: { cookie: 'session' } },
    );
    expect(response.status).toBe(404);
    expect(services.preferences.setRegion).not.toHaveBeenCalled();
  });
});
