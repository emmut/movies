import { cacheEventHeaders, verifyCacheEvent } from '@movies/auth/cache-events';
import { describe, expect, it } from 'vite-plus/test';

const secret = 'cache-event-fixture-secret';
const now = 1_000_000;
const body = JSON.stringify({ domain: 'preferences', userId: 'owner' });
function signed() {
  return new Headers(cacheEventHeaders(body, secret, now));
}
describe('signed cache events', () => {
  it('authenticates the body within the clock window; repeating an idempotent invalidation is safe', () => {
    expect(verifyCacheEvent(body, signed(), secret, now)).toBe(true);
    expect(verifyCacheEvent(body, signed(), secret, now + 30_000)).toBe(true);
    expect(verifyCacheEvent(body, signed(), secret, now - 30_000)).toBe(true);
    expect(verifyCacheEvent(body, signed(), secret, now + 30_001)).toBe(false);
  });
  it.each(['', 'NaN', 'Infinity', '12.5'])('rejects invalid or missing timestamps: %s', (time) => {
    const headers = signed();
    headers.set('x-cache-time', time);
    expect(verifyCacheEvent(body, headers, secret, now)).toBe(false);
  });
  it.each(['', 'f', 'z'.repeat(64), '00'.repeat(32)])(
    'rejects malformed or incorrect signatures: %s',
    (signature) => {
      const headers = signed();
      headers.set('x-cache-signature', signature);
      expect(verifyCacheEvent(body, headers, secret, now)).toBe(false);
    },
  );
  it('rejects modified bodies, missing headers and a different signing key', () => {
    expect(verifyCacheEvent(body + ' ', signed(), secret, now)).toBe(false);
    expect(verifyCacheEvent(body, signed(), 'other-secret', now)).toBe(false);
    expect(verifyCacheEvent(body, new Headers(), secret, now)).toBe(false);
  });
});
