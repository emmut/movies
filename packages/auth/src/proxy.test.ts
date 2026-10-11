import { describe, expect, it } from 'vitest';

import { AUTH_CLIENT_IP_HEADER, authProxyHeaders, verifiedAuthRequest } from './proxy';

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
  it.each(['203.0.113.7', '2001:db8::1'])(
    'preserves trusted %s and the original body',
    async (ip) => {
      const request = verifiedAuthRequest(signedRequest(ip), secret, now);
      expect(request.headers.get(AUTH_CLIENT_IP_HEADER)).toBe(ip);
      expect(request.headers.has('x-movies-auth-ip-signature')).toBe(false);
      expect(request.headers.has('x-movies-auth-ip-time')).toBe(false);
      expect(await request.json()).toEqual({});
    },
  );
  it('removes unsigned caller-selected identities', () => {
    const request = new Request('https://auth.test/api/auth/get-session', {
      headers: { [AUTH_CLIENT_IP_HEADER]: '198.51.100.9', 'x-real-ip': '203.0.113.7' },
    });
    const verified = verifiedAuthRequest(request, secret, now);
    expect(verified.headers.has(AUTH_CLIENT_IP_HEADER)).toBe(false);
    expect(verified.headers.get('x-real-ip')).toBe('203.0.113.7');
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
    expect(() => verifiedAuthRequest(request, secret, now)).toThrow(
      'Invalid authentication proxy metadata',
    );
  });
  it.each([now - 30_001, now + 30_001])('rejects expired or future-dated signatures', (time) => {
    expect(() => verifiedAuthRequest(signedRequest(), secret, time)).toThrow(
      'Invalid authentication proxy metadata',
    );
  });
  it('binds identity to the secret, method and endpoint', () => {
    expect(() => verifiedAuthRequest(signedRequest(), 'different-secret', now)).toThrow();
    expect(() =>
      verifiedAuthRequest(
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
      verifiedAuthRequest(
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
      expect(() => verifiedAuthRequest(request, secret, now)).toThrow();
    }
  });
});
