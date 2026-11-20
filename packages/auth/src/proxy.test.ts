import { describe, expect, it } from 'vite-plus/test';

import { AUTH_CLIENT_IP_HEADER, authProxyHeaders, verifiedProxyIp } from './proxy';

const secret = 'a-shared-auth-secret-of-at-least-32-characters';
const now = 1_000_000;
function signedRequest(ip = '203.0.113.7') {
  return new Request('https://auth.test/api/auth/sign-in/anonymous', {
    method: 'POST',
    headers: authProxyHeaders(secret, ip, 'POST', '/api/auth/sign-in/anonymous', now),
    body: '{}',
  });
}
describe('signed auth proxy metadata', () => {
  it.each(['203.0.113.7', '2001:db8::1'])('verifies trusted %s', (ip) => {
    expect(verifiedProxyIp(signedRequest(ip), secret, now)).toBe(ip);
  });
  it('ignores unsigned caller-selected identities', () => {
    const request = new Request('https://auth.test/api/auth/get-session', {
      headers: { [AUTH_CLIENT_IP_HEADER]: '198.51.100.9' },
    });
    expect(verifiedProxyIp(request, secret, now)).toBeUndefined();
  });
  it('rejects untrusted IP values before signing', () => {
    expect(() => signedRequest('203.0.113.7, 198.51.100.1')).toThrow(
      'Invalid authentication proxy metadata',
    );
  });
  it.each([
    ['x-movies-auth-client-ip', '198.51.100.1'],
    ['x-movies-auth-client-ip', 'invalid'],
    ['x-movies-auth-ip-time', 'NaN'],
    ['x-movies-auth-ip-time', '9999999999999999999999'],
    ['x-movies-auth-ip-signature', 'invalid'],
    ['x-movies-auth-ip-signature', '0'.repeat(64)],
  ])('rejects tampered %s', (name, value) => {
    const request = signedRequest();
    request.headers.set(name, value);
    expect(() => verifiedProxyIp(request, secret, now)).toThrow(
      'Invalid authentication proxy metadata',
    );
  });
  it.each([now - 30_001, now + 30_001])('rejects expired or future-dated signatures', (time) => {
    expect(() => verifiedProxyIp(signedRequest(), secret, time)).toThrow(
      'Invalid authentication proxy metadata',
    );
  });
  it('binds identity to the secret, method and endpoint', () => {
    expect(() => verifiedProxyIp(signedRequest(), 'different-secret', now)).toThrow();
    expect(() =>
      verifiedProxyIp(
        new Request('https://auth.test/api/auth/sign-out', {
          method: 'POST',
          headers: signedRequest().headers,
          body: '{}',
        }),
        secret,
        now,
      ),
    ).toThrow();
    expect(() =>
      verifiedProxyIp(
        new Request('https://auth.test/api/auth/sign-in/anonymous', {
          headers: signedRequest().headers,
        }),
        secret,
        now,
      ),
    ).toThrow();
  });
  it('rejects incomplete metadata', () => {
    for (const name of [
      AUTH_CLIENT_IP_HEADER,
      'x-movies-auth-ip-time',
      'x-movies-auth-ip-signature',
    ]) {
      const request = signedRequest();
      request.headers.delete(name);
      expect(() => verifiedProxyIp(request, secret, now)).toThrow();
    }
  });
});
