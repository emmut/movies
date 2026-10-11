import { hasDiscoverySessionError } from '@native/lib/discovery-session';
import { expect, it } from 'vitest';

it('allows public catalog-only hosts but retains recovery for real or stale-account failures', () => {
  const unavailable = { status: 503, code: 'AUTH_NOT_CONFIGURED' };
  expect(hasDiscoverySessionError({ error: null, data: null })).toBe(false);
  expect(hasDiscoverySessionError({ error: unavailable, data: null })).toBe(false);
  expect(hasDiscoverySessionError({ error: new Error('offline'), data: null })).toBe(true);
  expect(hasDiscoverySessionError({ error: unavailable, data: { user: { id: 'cached-account' } } })).toBe(true);
});
