import { describe, expect, it } from 'vitest';

import { resolveServiceUrl } from './service-url';

describe('development service addresses', () => {
  it('uses the Expo host instead of the phone’s localhost', () => {
    expect(resolveServiceUrl({ expoHost: '192.168.1.78:8081', port: 3001 })).toBe(
      'http://192.168.1.78:3001',
    );
  });
  it('uses the browser host for LAN previews', () => {
    expect(resolveServiceUrl({ browserOrigin: 'http://192.168.1.78:8081', port: 3001 })).toBe(
      'http://192.168.1.78:3001',
    );
  });
  it('uses the browser host ahead of Expo metadata', () => {
    expect(
      resolveServiceUrl({
        browserOrigin: 'http://localhost:8081',
        expoHost: '192.168.1.78:8081',
        port: 3000,
      }),
    ).toBe('http://localhost:3000');
  });
  it('keeps explicit production or tunnel API URLs', () => {
    expect(
      resolveServiceUrl({
        explicitUrl: ' https://api.example.com/ ',
        expoHost: '192.168.1.78:8081',
        port: 3001,
      }),
    ).toBe('https://api.example.com');
  });
  it('ignores an empty env value and supports IPv6 hosts', () => {
    expect(resolveServiceUrl({ explicitUrl: ' ', expoHost: '[::1]:8081', port: 3001 })).toBe(
      'http://[::1]:3001',
    );
  });
  it('falls back for static exports without a dev host', () => {
    expect(resolveServiceUrl({ port: 3001 })).toBe('http://localhost:3001');
  });
});
