import { describe, expect, it } from 'vite-plus/test';

import { classifyPasskeyError, passkeyFailureMessage } from './passkey-errors';

describe('classifyPasskeyError', () => {
  it.each(['ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY', 'ERROR_CEREMONY_ABORTED'])(
    'treats %s as a cancelled prompt',
    (code) => {
      expect(classifyPasskeyError({ code })).toBe('cancelled');
    },
  );

  it('recognises an authenticator that already holds a passkey', () => {
    expect(classifyPasskeyError({ code: 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED' })).toBe(
      'already-registered',
    );
  });

  it.each([
    ['an unrelated code', { code: 'AUTH_CANCELLED' }],
    ['a non-string code', { code: 401 }],
    ['an object without a code', { message: 'nope' }],
    ['a thrown Error', new Error('network down')],
    ['null', null],
    ['a string', 'boom'],
  ])('treats %s as a failure', (_label, error) => {
    expect(classifyPasskeyError(error)).toBe('failed');
  });
});

describe('passkeyFailureMessage', () => {
  it('stays silent for a cancelled prompt', () => {
    expect(passkeyFailureMessage('cancelled', 'fallback')).toBeNull();
  });

  it('explains an already-registered authenticator', () => {
    expect(passkeyFailureMessage('already-registered', 'fallback')).toBe(
      'This device already has a passkey for your account.',
    );
  });

  it('falls back to the caller message for other failures', () => {
    expect(passkeyFailureMessage('failed', 'fallback')).toBe('fallback');
  });
});
