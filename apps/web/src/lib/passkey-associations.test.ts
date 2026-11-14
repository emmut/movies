import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
const config = vi.hoisted(() => ({
  PASSKEY_APPLE_TEAM_ID: undefined as string | undefined,
  PASSKEY_ANDROID_FINGERPRINTS: [] as string[],
}));
vi.mock('@/env', () => ({ env: config }));
import { GET as apple } from '@/app/.well-known/apple-app-site-association/route';
import { GET as android } from '@/app/.well-known/assetlinks.json/route';
beforeEach(() => {
  config.PASSKEY_APPLE_TEAM_ID = undefined;
  config.PASSKEY_ANDROID_FINGERPRINTS = [];
});
describe('public credential association routes', () => {
  it('does not publish placeholder associations before signing identities are configured', () => {
    expect(apple().status).toBe(404);
    expect(android().status).toBe(404);
  });
  it('serves JSON associations for the configured signing identities', async () => {
    config.PASSKEY_APPLE_TEAM_ID = 'AB12CD34EF';
    config.PASSKEY_ANDROID_FINGERPRINTS = ['ab'.repeat(32)];
    const response = apple();
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    expect(await response.json()).toEqual({
      webcredentials: { apps: ['AB12CD34EF.com.movies.app'] },
    });
    expect((await android().json())[0].target.sha256_cert_fingerprints).toEqual([
      Array(32).fill('AB').join(':'),
    ]);
  });
});
