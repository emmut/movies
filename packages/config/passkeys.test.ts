import { describe, expect, it } from 'vite-plus/test';

import {
  androidFingerprintsSchema,
  androidPasskeyAssociation,
  applePasskeyAssociation,
  passkeyDomainSchema,
} from './passkeys';

const fingerprint = '01'.repeat(32);
describe('native passkey association metadata', () => {
  it('uses one app identity for Apple and Android without claiming app-link handling', () => {
    expect(applePasskeyAssociation('AB12CD34EF')).toEqual({
      webcredentials: { apps: ['AB12CD34EF.com.movies.app'] },
    });
    expect(androidPasskeyAssociation([fingerprint])).toEqual([
      {
        relation: ['delegate_permission/common.get_login_creds'],
        target: {
          namespace: 'android_app',
          package_name: 'com.movies.app',
          sha256_cert_fingerprints: [Array(32).fill('01').join(':')],
        },
      },
    ]);
  });
  it('normalizes and deduplicates certificate hashes while preserving multiple signing certificates', () => {
    expect(
      androidFingerprintsSchema.parse(fingerprint + ',' + fingerprint + ',' + 'ab'.repeat(32)),
    ).toEqual([Array(32).fill('01').join(':'), Array(32).fill('AB').join(':')]);
    expect(androidFingerprintsSchema.parse(undefined)).toEqual([]);
  });
  it.each(['bad', '01'.repeat(31), 'zz'.repeat(32)])(
    'rejects a malformed signing certificate',
    (value) => {
      expect(androidFingerprintsSchema.safeParse(value).success).toBe(false);
    },
  );
  it.each([
    'https://auth.example.com',
    'localhost',
    'auth.example.com/path',
    'auth..example.com',
    'user@auth.example.com',
  ])('does not accept a URL, local host or malformed association domain', (value) => {
    expect(passkeyDomainSchema.safeParse(value).success).toBe(false);
  });
  it('normalizes a valid auth host and rejects a placeholder Apple team ID', () => {
    expect(passkeyDomainSchema.parse('Auth.Example.com')).toBe('auth.example.com');
    expect(() => applePasskeyAssociation('TEAM_ID')).toThrow();
  });
});
