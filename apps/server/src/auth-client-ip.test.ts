import { authClientIp } from '@server/auth-client-ip';
import { describe, expect, it } from 'vitest';

describe('auth ingress identity', () => {
  it('uses the transport peer on direct hosts and ignores forged headers', () => {
    expect(
      authClientIp(
        'socket',
        new Headers({ 'x-real-ip': '203.0.113.8', 'x-forwarded-for': '203.0.113.9' }),
        '198.51.100.1',
      ),
    ).toBe('198.51.100.1');
  });
  it('uses only the Railway-overwritten single IP in explicit Railway mode', () => {
    expect(
      authClientIp(
        'railway',
        new Headers({
          'x-real-ip': '203.0.113.8',
          'x-forwarded-for': 'forged',
          'cf-connecting-ip': 'forged',
        }),
        '198.51.100.1',
      ),
    ).toBe('203.0.113.8');
  });
  it.each([undefined, '', 'invalid', '203.0.113.8, 198.51.100.1'])(
    'rejects missing or malformed transport metadata',
    (peer) => {
      expect(() => authClientIp('socket', new Headers(), peer)).toThrow(
        'Trusted authentication client IP is unavailable',
      );
      expect(() =>
        authClientIp('railway', new Headers(peer ? { 'x-real-ip': peer } : {}), '198.51.100.1'),
      ).toThrow();
    },
  );
});
