import { createApp } from '@server/app';
import { createTestClient, mockServices } from '@server/test-services';
import { describe, expect, it, vi } from 'vite-plus/test';

function setup() {
  const home = { list: vi.fn().mockResolvedValue([]), trending: vi.fn().mockResolvedValue([]) };
  const catalog = {
    reviews: vi.fn(),
    credits: vi.fn(),
    details: vi.fn(),
    trailer: vi.fn(),
    providers: vi.fn(),
    related: vi.fn(),
  };
  const app = createApp(mockServices({ home, catalog }), 'http://localhost:8081');
  const client = createTestClient(app);
  return { home, catalog, app, client };
}
describe('homepage RPC transport', () => {
  it('serves health and leaves unknown routes as 404', async () => {
    const { app } = setup();
    expect(await (await app.request('/health')).json()).toEqual({ status: 'ok' });
    expect((await app.request('/rpc/missing')).status).toBe(404);
  });
  it('roundtrips list and trending calls with defaults', async () => {
    const { client, home } = setup();
    expect(await client.home.list({ category: 'popular-tv' })).toEqual([]);
    expect(home.list).toHaveBeenCalledWith({ category: 'popular-tv', region: 'SE' });
    await client.home.trending({ type: 'tv' });
    expect(home.trending).toHaveBeenCalledWith({ type: 'tv' });
  });
  it('rejects unsupported categories, regions and types before fetching', async () => {
    const { app, home } = setup();
    for (const [path, input] of [
      ['list', { category: 'invalid', region: 'US' }],
      ['list', { category: 'popular-tv', region: 'XX' }],
      ['trending', { type: 'person' }],
    ]) {
      const response = await app.request(`/rpc/home/${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: input }),
      });
      expect(response.status).toBe(400);
    }
    expect(home.list).not.toHaveBeenCalled();
    expect(home.trending).not.toHaveBeenCalled();
  });
  it('allows browser preflight from the configured consumer', async () => {
    const { app } = setup();
    const response = await app.request('/rpc/home/list', {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:8081', 'access-control-request-method': 'POST' },
    });
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:8081');
  });
  it('allows a LAN browser preview in development without hardcoding its IP', async () => {
    const home = { list: vi.fn().mockResolvedValue([]), trending: vi.fn().mockResolvedValue([]) };
    const app = createApp(mockServices({ home }));
    const origin = 'http://192.168.1.78:8081';
    const response = await app.request('/rpc/home/list', {
      method: 'OPTIONS',
      headers: { origin, 'access-control-request-method': 'POST' },
    });
    expect(response.headers.get('access-control-allow-origin')).toBe(origin);
  });
  it.each([
    'http://localhost:8082',
    'http://127.0.0.1:8081',
    'http://[::1]:8081',
    'http://10.0.2.2:8081',
    'http://172.16.0.2:8081',
  ])('allows local dev origin %s', async (origin) => {
    const app = createApp(mockServices());
    const response = await app.request('/rpc/home/list', {
      method: 'OPTIONS',
      headers: { origin },
    });
    expect(response.headers.get('access-control-allow-origin')).toBe(origin);
  });
  it.each([
    'https://external.example',
    'http://192.168.1.78.attacker.example',
    'http://172.32.0.2:8081',
  ])('rejects unrelated dev origins %s', async (origin) => {
    const app = createApp(mockServices());
    const response = await app.request('/rpc/home/list', {
      method: 'OPTIONS',
      headers: { origin },
    });
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
  it('an explicit origin overrides the development allowlist', async () => {
    const { app } = setup();
    const response = await app.request('/rpc/home/list', {
      method: 'OPTIONS',
      headers: { origin: 'http://192.168.1.78:8081' },
    });
    expect(response.headers.get('access-control-allow-origin')).not.toBe(
      'http://192.168.1.78:8081',
    );
  });
  it('does not expose service errors or accept malformed service output', async () => {
    const { client, home } = setup();
    home.list.mockRejectedValueOnce(new Error('secret upstream detail'));
    await expect(client.home.list({ category: 'popular-tv' })).rejects.toThrow(
      'Internal server error',
    );
    home.list.mockResolvedValueOnce([{ id: -1 }]);
    await expect(client.home.list({ category: 'popular-tv' })).rejects.toThrow();
  });
});
