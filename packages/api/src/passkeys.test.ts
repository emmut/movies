import { describe, expect, it } from 'vite-plus/test';

import { formatPasskeyDate, passkeyListSchema, passkeyNameSchema } from './passkeys';

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
