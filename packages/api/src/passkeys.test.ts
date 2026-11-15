import { describe, expect, it } from 'vite-plus/test';

import {
  classifyPasskeyError,
  deviceTypeLabel,
  formatPasskeyDate,
  PASSKEY_ERROR,
  passkeyFailureMessage,
  passkeyListSchema,
  passkeyNameSchema,
} from './passkeys';

describe('shared passkey presentation', () => {
  it('keeps only presentation metadata and parses dates without caching credential material', () => {
    const parsed = passkeyListSchema.parse([
      {
        id: 'key',
        name: null,
        createdAt: '2026-01-02T12:00:00.000Z',
        deviceType: 'multiDevice',
        publicKey: 'not-used',
        credentialID: 'not-used',
      },
    ]);
    expect(parsed[0]).not.toHaveProperty('publicKey');
    expect(parsed[0]).not.toHaveProperty('credentialID');
    expect(formatPasskeyDate(parsed[0].createdAt)).toBe('2 Jan 2026');
  });
  it('distinguishes a genuinely empty list from malformed data', () => {
    expect(passkeyListSchema.parse([])).toEqual([]);
    expect(() => passkeyListSchema.parse(null)).toThrow();
    expect(() =>
      passkeyListSchema.parse([{ id: 'x', deviceType: 'singleDevice', createdAt: 'invalid' }]),
    ).toThrow();
  });
  it('does not turn a missing date into epoch time', () => {
    expect(formatPasskeyDate(null)).toBe('Unknown');
    expect(formatPasskeyDate(new Date('invalid'))).toBe('Unknown');
  });
  it('shares trimmed passkey-name validation across clients', () => {
    expect(passkeyNameSchema.parse(' My phone ')).toBe('My phone');
    expect(passkeyNameSchema.safeParse(' ').success).toBe(false);
    expect(passkeyNameSchema.safeParse('a'.repeat(101)).success).toBe(false);
  });
});

describe('deviceTypeLabel', () => {
  it.each([
    ['multiDevice', 'Synced'],
    ['singleDevice', 'This device only'],
    ['somethingNew', 'somethingNew'],
  ])('labels %s as %s', (deviceType, label) => {
    expect(deviceTypeLabel(deviceType)).toBe(label);
  });
});

describe('classifyPasskeyError', () => {
  it.each([PASSKEY_ERROR.cancelled, 'ERROR_CEREMONY_ABORTED'])(
    'treats %s as a cancelled prompt',
    (code) => {
      expect(classifyPasskeyError({ code })).toBe('cancelled');
    },
  );

  it.each([PASSKEY_ERROR.alreadyRegistered, 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED'])(
    'treats %s as an authenticator that already holds a passkey',
    (code) => {
      expect(classifyPasskeyError({ code })).toBe('already-registered');
    },
  );

  it('recognises a device without a passkey for the site', () => {
    expect(classifyPasskeyError({ code: PASSKEY_ERROR.noCredentials })).toBe('no-credentials');
  });

  it.each([
    ['an unrelated code', { code: 'AUTH_CANCELLED' }],
    ['a non-string code', { code: 401 }],
    ['an inherited code', Object.create({ code: PASSKEY_ERROR.cancelled })],
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

  it.each([
    ['already-registered', 'This device already has a passkey for your account.'],
    ['no-credentials', 'No passkey for Movies was found on this device.'],
    ['failed', 'fallback'],
  ] as const)('describes %s', (reason, message) => {
    expect(passkeyFailureMessage(reason, 'fallback')).toBe(message);
  });
});

it.each(['SecurityError', 'UnknownError', 'InvalidStateError'])(
  'does not silence a browser %s',
  (name) => {
    expect(
      classifyPasskeyError({
        code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
        cause: new DOMException('failed', name),
      }),
    ).toBe('failed');
  },
);
it('only suppresses a passthrough with a NotAllowedError cause', () => {
  expect(
    classifyPasskeyError({
      code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
      cause: new DOMException('dismissed', 'NotAllowedError'),
    }),
  ).toBe('cancelled');
  expect(classifyPasskeyError({ code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY' })).toBe('failed');
});
