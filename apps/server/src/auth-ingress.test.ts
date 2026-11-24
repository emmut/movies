import { AUTH_CLIENT_IP_HEADER, authProxyHeaders } from '@movies/auth/proxy';
import { authIngressHeaders } from '@server/auth-ingress';
import { expect, it, vi } from 'vite-plus/test';

it('strips unsigned client IP metadata and binds proxy assertions to path/method', () => {
  const secret = 'a-fixture-secret-of-at-least-32-characters';
  const request = new Request('http://api.test/api/auth/get-session', {
    headers: {
      [AUTH_CLIENT_IP_HEADER]: 'forged',
      'x-real-ip': 'forged',
      'x-forwarded-for': 'forged',
    },
  });
  const direct = authIngressHeaders(request, secret, () => '203.0.113.5');
  expect(direct.get(AUTH_CLIENT_IP_HEADER)).toBe('203.0.113.5');
  expect(direct.has('x-real-ip')).toBe(false);
  expect(direct.has('x-forwarded-for')).toBe(false);
  const signed = authProxyHeaders(secret, '203.0.113.6', 'GET', '/api/auth/get-session');
  expect(
    authIngressHeaders(new Request(request, { headers: signed }), secret, () => '203.0.113.5').get(
      AUTH_CLIENT_IP_HEADER,
    ),
  ).toBe('203.0.113.6');
  expect(() =>
    authIngressHeaders(
      new Request('http://api.test/api/auth/sign-out', { headers: signed }),
      secret,
    ),
  ).toThrow('Invalid authentication proxy metadata');
});

it('does not require public ingress metadata for a verified web proxy assertion', () => {
  const secret = 'a-fixture-secret-of-at-least-32-characters';
  const headers = authProxyHeaders(secret, '203.0.113.6', 'GET', '/api/auth/get-session');
  const ingress = vi.fn(() => {
    throw new Error('Public ingress unavailable');
  });
  const request = authIngressHeaders(
    new Request('http://api.internal/api/auth/get-session', { headers }),
    secret,
    ingress,
  );
  expect(request.get(AUTH_CLIENT_IP_HEADER)).toBe('203.0.113.6');
  expect(ingress).not.toHaveBeenCalled();
});
