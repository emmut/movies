import appConfig from '@native/app.config';
import type { ConfigContext } from 'expo/config';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const env = vi.hoisted(() => ({
  EAS_BUILD_PROFILE: undefined as string | undefined,
  EXPO_PUBLIC_SERVER_URL: undefined as string | undefined,
  EXPO_PUBLIC_PASSKEY_DOMAIN: undefined as string | undefined,
}));
vi.mock('varlock/auto-load', () => ({}));
vi.mock('@native/src/env', () => ({ ENV: env }));

const context: ConfigContext = {
  projectRoot: '/movies',
  staticConfigPath: null,
  packageJsonPath: '/movies/package.json',
  config: {},
};
beforeEach(() => {
  env.EAS_BUILD_PROFILE = undefined;
  env.EXPO_PUBLIC_SERVER_URL = undefined;
  env.EXPO_PUBLIC_PASSKEY_DOMAIN = undefined;
});
describe('native build configuration', () => {
  it('keeps local builds usable without a hosted API', () => {
    expect(appConfig(context)).toMatchObject({ name: 'Movies', slug: 'movies' });
  });
  it.each(['preview', 'production'])('requires HTTPS for the %s build', (profile) => {
    env.EAS_BUILD_PROFILE = profile;
    expect(() => appConfig(context)).toThrow('HTTPS API URL');
    env.EXPO_PUBLIC_SERVER_URL = 'http://localhost:4000';
    expect(() => appConfig(context)).toThrow('HTTPS API URL');
    env.EXPO_PUBLIC_SERVER_URL = 'https://api.example.com';
    expect(() => appConfig(context)).not.toThrow();
  });
  it('preserves configured names and deduplicates associated domains', () => {
    env.EXPO_PUBLIC_PASSKEY_DOMAIN = 'movies.example.com';
    expect(
      appConfig({
        ...context,
        config: {
          name: 'Movies Preview',
          slug: 'movies-preview',
          ios: {
            associatedDomains: ['applinks:movies.example.com', 'webcredentials:movies.example.com'],
          },
        },
      }),
    ).toMatchObject({
      name: 'Movies Preview',
      slug: 'movies-preview',
      ios: {
        associatedDomains: ['applinks:movies.example.com', 'webcredentials:movies.example.com'],
      },
    });
  });
  it('rejects a URL where a passkey hostname is required', () => {
    env.EXPO_PUBLIC_PASSKEY_DOMAIN = 'https://movies.example.com';
    expect(() => appConfig(context)).toThrow();
  });
});
