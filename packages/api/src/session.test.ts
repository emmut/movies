import { expect, it } from 'vite-plus/test';

import { AUTH_NOT_CONFIGURED, isAuthNotConfigured } from './session';

it('permits public fallback only for an explicitly unconfigured authentication host', () => {
  expect(isAuthNotConfigured({ status: 503, code: AUTH_NOT_CONFIGURED })).toBe(true);
  for (const error of [
    null,
    undefined,
    new Error('offline'),
    { status: 502, code: AUTH_NOT_CONFIGURED },
    { status: 503, code: 'INTERNAL_SERVER_ERROR' },
    { status: 503 },
  ]) {
    expect(isAuthNotConfigured(error)).toBe(false);
  }
});
