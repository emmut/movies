import { AUTH_CLIENT_IP_HEADER, verifiedAuthRequest } from '@movies/auth/proxy';
import { createAuthGateway } from '@server/auth-gateway';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { anonymous } from 'better-auth/plugins';
import { expect, it } from 'vitest';

it('preserves distinct client limits through the gateway without accepting caller IP spoofing', async () => {
  const secret = 'a-shared-auth-secret-of-at-least-32-characters';
  const auth = betterAuth({
    baseURL: 'http://auth.test',
    secret,
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    plugins: [anonymous()],
    advanced: { ipAddress: { ipAddressHeaders: [AUTH_CLIENT_IP_HEADER, 'x-real-ip'] } },
    rateLimit: { enabled: true, storage: 'memory' },
  });
  const gateway = createAuthGateway(
    'http://auth.test',
    async (url, options) => {
      // The web public ingress sees the gateway's egress IP, not the original client.
      const request = new Request(String(url), options);
      request.headers.set('x-real-ip', '192.0.2.99');
      return auth.handler(verifiedAuthRequest(request, secret));
    },
    secret,
  );
  function attempt(peer: string, forged = '198.51.100.77') {
    return gateway.handle(
      new Request('http://api.test/api/auth/sign-in/anonymous', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://auth.test',
          'x-real-ip': forged,
          'x-forwarded-for': forged,
          [AUTH_CLIENT_IP_HEADER]: forged,
        },
        body: '{}',
      }),
      peer,
    );
  }
  for (let index = 0; index < 3; index += 1) {
    expect((await attempt('203.0.113.77')).status).toBe(200);
  }
  expect((await attempt('203.0.113.77', '203.0.113.78')).status).toBe(429);
  expect((await attempt('203.0.113.78')).status).toBe(200);
});
