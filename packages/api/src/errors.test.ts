import { describe, expect, it } from 'vite-plus/test';

import { hasErrorCode } from './errors';

describe('error classification', () => {
  it('matches explicit response codes and Error instances', () => {
    expect(hasErrorCode({ code: 'NOT_FOUND' }, 'NOT_FOUND')).toBe(true);
    expect(
      hasErrorCode(Object.assign(new Error('expired'), { code: 'UNAUTHORIZED' }), 'UNAUTHORIZED'),
    ).toBe(true);
    expect(hasErrorCode({ code: 'AUTH_CANCELLED' }, 'PASSKEY_CANCELLED', 'AUTH_CANCELLED')).toBe(
      true,
    );
  });
  it.each([
    null,
    undefined,
    'NOT_FOUND',
    404,
    {},
    { code: 404 },
    Object.create({ code: 'NOT_FOUND' }),
  ])('rejects missing, non-string and inherited codes: %j', (error) => {
    expect(hasErrorCode(error, 'NOT_FOUND')).toBe(false);
  });
  it('supports null-prototype responses and shadowed hasOwnProperty', () => {
    expect(
      hasErrorCode(Object.assign(Object.create(null), { code: 'NOT_FOUND' }), 'NOT_FOUND'),
    ).toBe(true);
    expect(hasErrorCode({ code: 'NOT_FOUND', hasOwnProperty: null }, 'NOT_FOUND')).toBe(true);
  });
});
