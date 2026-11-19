import { AUTH_CLIENT_IP_HEADER, authProxyHeaders } from '@movies/auth/proxy';
import { createApp } from '@server/app';
import { mockServices } from '@server/test-services';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { anonymous } from 'better-auth/plugins';
import { expect, it } from 'vite-plus/test';

it('uses trusted ingress and signed web IPs for Better Auth limits, rejecting spoofed metadata', async () => {
  const secret = 'a-shared-auth-secret-of-at-least-32-characters';
  const auth = betterAuth({
    baseURL: 'http://auth.test',
    secret,
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    plugins: [anonymous()],
    advanced: { ipAddress: { ipAddressHeaders: [AUTH_CLIENT_IP_HEADER] } },
    rateLimit: { enabled: true, storage: 'memory' },
  });
  const app = createApp(mockServices(), {
    auth,
    rpcProxySecret: secret,
    clientIp: () => '203.0.113.77',
  });
  function attempt(signed?: Headers) {
    const headers =
      signed ??
      new Headers({ [AUTH_CLIENT_IP_HEADER]: '198.51.100.77', 'x-real-ip': '198.51.100.78' });
    headers.set('content-type', 'application/json');
    headers.set('origin', 'http://auth.test');
    return app.request('/api/auth/sign-in/anonymous', { method: 'POST', headers, body: '{}' });
  }
  for (let index = 0; index < 3; index += 1) {
    expect((await attempt()).status).toBe(200);
  }
  expect((await attempt()).status).toBe(429);
  expect(
    (await attempt(authProxyHeaders(secret, '203.0.113.78', 'POST', '/api/auth/sign-in/anonymous')))
      .status,
  ).toBe(200);
  expect(
    (
      await attempt(
        authProxyHeaders('forged', '203.0.113.79', 'POST', '/api/auth/sign-in/anonymous'),
      )
    ).status,
  ).toBe(400);
});
