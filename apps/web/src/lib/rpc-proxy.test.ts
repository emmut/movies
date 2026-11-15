import { verifiedProxyIp, authProxyHeaders } from '@movies/auth/proxy';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { rpcProxyHeaders } from './rpc-proxy';

const config = vi.hoisted(() => ({
  RPC_IP_SOURCE: 'none',
  BETTER_AUTH_SECRET: 'a-fixture-auth-secret-at-least-32-characters',
}));
vi.mock('@/env', () => ({ ENV: config }));

afterEach(() => {
  config.RPC_IP_SOURCE = 'none';
});
it('signs Railway ingress identity without forwarding caller identities or proxy signatures', () => {
  config.RPC_IP_SOURCE = 'railway';
  const source = authProxyHeaders(
    'a-forged-secret',
    '198.51.100.99',
    'POST',
    '/rpc/preferences/region',
  );
  source.set('cookie', 'verified-session-cookie');
  source.set('x-real-ip', '203.0.113.10');
  source.set('x-user-id', 'victim');
  source.set('authorization', 'forged');
  const headers = rpcProxyHeaders(source, 'POST', '/rpc/preferences/region');
  const request = new Request('https://api.example.com/rpc/preferences/region', {
    method: 'POST',
    headers,
  });
  expect(verifiedProxyIp(request, config.BETTER_AUTH_SECRET)).toBe('203.0.113.10');
  expect(headers.get('cookie')).toBe('verified-session-cookie');
  expect(headers.has('x-user-id')).toBe(false);
  expect(headers.has('authorization')).toBe(false);
  expect(headers.has('x-real-ip')).toBe(false);
});
it('does not trust IP fields when trusted ingress is not configured', () => {
  const headers = rpcProxyHeaders(
    new Headers({ cookie: 'session', 'x-real-ip': '203.0.113.10' }),
    'POST',
    '/rpc/session/current',
  );
  expect(
    verifiedProxyIp(
      new Request('https://api.example.com/rpc/session/current', { method: 'POST', headers }),
      config.BETTER_AUTH_SECRET,
    ),
  ).toBeUndefined();
});
it('fails closed for missing Railway identity and leaves public prerender reads unsigned', () => {
  config.RPC_IP_SOURCE = 'railway';
  expect(() =>
    rpcProxyHeaders(new Headers({ cookie: 'session' }), 'POST', '/rpc/session/current'),
  ).toThrow();
  expect(Array.from(rpcProxyHeaders(new Headers(), 'POST', '/rpc/home/list')).length).toBe(0);
});
