import { AUTH_CLIENT_IP_HEADER, authProxyHeaders } from '@movies/auth/proxy';
import { beforeEach, expect, it, vi } from 'vite-plus/test';

const secret = 'a-shared-auth-secret-of-at-least-32-characters';
const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('better-auth/next-js', () => ({ toNextJsHandler: () => ({ GET: get, POST: post }) }));
vi.mock('@/lib/auth', () => ({ auth: {} }));
vi.mock('@/env', () => ({
  env: { BETTER_AUTH_SECRET: 'a-shared-auth-secret-of-at-least-32-characters' },
}));
import { GET, POST } from './route';

beforeEach(() => {
  get.mockReset().mockResolvedValue(Response.json({ success: true }));
  post.mockReset().mockResolvedValue(Response.json({ success: true }));
});

it('verifies gateway IP metadata before the GET auth handler receives it', async () => {
  const request = new Request('https://web.test/api/auth/get-session', {
    headers: authProxyHeaders(secret, '203.0.113.1', 'GET', '/api/auth/get-session'),
  });
  expect((await GET(request)).status).toBe(200);
  expect(get.mock.calls[0][0].headers.get(AUTH_CLIENT_IP_HEADER)).toBe('203.0.113.1');
  expect(post).not.toHaveBeenCalled();
});
it('strips unsigned client-supplied IPs from POST requests', async () => {
  const request = new Request('https://web.test/api/auth/sign-in/anonymous', {
    method: 'POST',
    headers: { [AUTH_CLIENT_IP_HEADER]: '203.0.113.1' },
    body: '{}',
  });
  expect((await POST(request)).status).toBe(200);
  expect(post.mock.calls[0][0].headers.has(AUTH_CLIENT_IP_HEADER)).toBe(false);
  expect(await post.mock.calls[0][0].json()).toEqual({});
});
it('rejects invalid signed metadata before invoking any auth handler', async () => {
  const request = new Request('https://web.test/api/auth/get-session', {
    headers: { 'x-movies-auth-ip-signature': 'forged' },
  });
  const response = await GET(request);
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ code: 'INVALID_AUTH_PROXY_METADATA' });
  expect(get).not.toHaveBeenCalled();
  expect(post).not.toHaveBeenCalled();
});
it('preserves genuine auth-handler failures', async () => {
  post.mockRejectedValueOnce(new Error('database unavailable'));
  await expect(
    POST(new Request('https://web.test/api/auth/sign-out', { method: 'POST' })),
  ).rejects.toThrow('database unavailable');
});
