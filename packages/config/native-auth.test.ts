import { describe, expect, it } from 'vite-plus/test';

import { isLocalBrowserOrigin, nativeTrustedOrigins } from './native-auth';

describe('native authentication origins', () => {
  it.each([
    'http://localhost:8083',
    'http://127.0.0.1:8081',
    'http://[::1]:8081',
    'http://192.168.1.78:8081',
    'http://10.0.0.1:8081',
    'http://172.31.1.2:8081',
  ])('permits a local preview only in development: %s', (origin) => {
    expect(isLocalBrowserOrigin(origin)).toBe(true);
    expect(nativeTrustedOrigins(true, origin)).toContain(origin);
    expect(nativeTrustedOrigins(false, origin)).not.toContain(origin);
  });
  it.each([
    'https://evil.example',
    'http://localhost.evil.example',
    'http://localhost:8081/path',
    'http://user@localhost:8081',
    'http://172.32.1.2:8081',
  ])('does not trust other browser origins: %s', (origin) => {
    expect(isLocalBrowserOrigin(origin)).toBe(false);
    expect(nativeTrustedOrigins(true, origin)).not.toContain(origin);
  });
  it('keeps app schemes trusted and Expo Go restricted to development', () => {
    expect(nativeTrustedOrigins(false)).toEqual(['movies://', 'movies://*']);
    expect(nativeTrustedOrigins(true)).toContain('exp://**');
  });
});
