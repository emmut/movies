import { describe, expect, it } from 'vite-plus/test';

import { passkeyOrigins } from './passkey-origins';

describe('WebAuthn origins for signed native clients', () => {
  it('includes the canonical iOS/web origin and only configured Android certificate hashes', () => {
    expect(passkeyOrigins('https://auth.example.com/api/auth', '00'.repeat(32), false)).toEqual([
      'https://auth.example.com',
      'android:apk-key-hash:' + Buffer.alloc(32).toString('base64url'),
    ]);
  });
  it('does not trust browser previews outside local development', () => {
    expect(passkeyOrigins('http://localhost:3000', undefined, false)).toEqual([
      'http://localhost:3000',
    ]);
    expect(passkeyOrigins('https://auth.example.com', undefined, true)).toEqual([
      'https://auth.example.com',
    ]);
  });
  it('permits the actual localhost Expo preview ports in development', () => {
    expect(passkeyOrigins('http://localhost:3000', undefined, true)).toContain(
      'http://localhost:8083',
    );
  });
});
