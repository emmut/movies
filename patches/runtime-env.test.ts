import { fileURLToPath } from 'node:url';

import { internal } from 'varlock';
import { describe, expect, it } from 'vite-plus/test';

async function schema(app: string, values: Record<string, string | undefined>) {
  const graph = await internal.loadEnvGraph({
    entryFilePaths: fileURLToPath(new URL(`../apps/${app}/.env.schema`, import.meta.url)),
    overrideValues: values,
    processEnvOverride: {},
    checkGitIgnored: false,
    skipCache: true,
  });
  await graph.resolveEnvValues();
  return graph.configSchema;
}

describe('Varlock runtime host validation', () => {
  it('requires canonical auth and signing configuration in production', async () => {
    const items = await schema('server', {
      NODE_ENV: 'production',
      MOVIE_DB_ACCESS_TOKEN: 'fixture',
    });
    expect(items.BETTER_AUTH_URL.isValid).toBe(false);
    expect(items.AUTH_PROXY_SECRET.isValid).toBe(false);
    expect(items.BETTER_AUTH_SECRET.isValid).toBe(false);
    expect(items.DATABASE_URL.isValid).toBe(false);
  });
  it('requires a signing secret when development enables auth', async () => {
    const items = await schema('server', {
      NODE_ENV: 'development',
      MOVIE_DB_ACCESS_TOKEN: 'fixture',
      BETTER_AUTH_URL: 'http://localhost:3000',
    });
    expect(items.BETTER_AUTH_URL.isValid).toBe(true);
    expect(items.AUTH_PROXY_SECRET.isValid).toBe(false);
    expect(items.BETTER_AUTH_SECRET.isValid).toBe(false);
    expect(items.DATABASE_URL.isValid).toBe(false);
  });
  it('requires canonical auth when a callback URL is configured', async () => {
    const items = await schema('server', {
      NODE_ENV: 'development',
      MOVIE_DB_ACCESS_TOKEN: 'fixture',
      WEB_URL: 'http://localhost:3000',
    });
    expect(items.BETTER_AUTH_URL.isValid).toBe(false);
  });
  it('permits public-only local previews and validates configured accounts', async () => {
    const publicItems = await schema('server', {
      NODE_ENV: 'development',
      MOVIE_DB_ACCESS_TOKEN: 'fixture',
    });
    expect(publicItems.BETTER_AUTH_URL.isValid).toBe(true);
    expect(publicItems.AUTH_PROXY_SECRET.isValid).toBe(true);
    const accountItems = await schema('server', {
      NODE_ENV: 'production',
      MOVIE_DB_ACCESS_TOKEN: 'fixture',
      BETTER_AUTH_URL: 'https://web.example.com',
      AUTH_PROXY_SECRET: 'a-fixture-secret-of-at-least-32-characters',
      BETTER_AUTH_SECRET: 'existing-session-secret-at-least-32-characters',
      DATABASE_URL: 'postgres://fixture:password@localhost/movies',
      DISCORD_CLIENT_ID: 'discord-id',
      DISCORD_CLIENT_SECRET: 'discord-secret',
      GITHUB_CLIENT_ID: 'github-id',
      GITHUB_CLIENT_SECRET: 'github-secret',
    });
    expect(accountItems.BETTER_AUTH_URL.isValid).toBe(true);
    expect(Object.values(accountItems).every((item) => item.isValid)).toBe(true);
    for (const key of [
      'BETTER_AUTH_SECRET',
      'AUTH_PROXY_SECRET',
      'DISCORD_CLIENT_SECRET',
      'GITHUB_CLIENT_SECRET',
    ]) {
      expect(accountItems[key].isSensitive).toBe(true);
    }
  });
  it('never defaults production API requests to localhost', async () => {
    const production = await schema('web', { NODE_ENV: 'production' });
    expect(production.API_URL.isValid).toBe(false);
    const development = await schema('web', { NODE_ENV: 'development' });
    expect(development.API_URL.resolvedValue).toBe('http://localhost:3001');
    const configured = await schema('web', {
      NODE_ENV: 'production',
      API_URL: 'https://api.example.com',
    });
    expect(configured.API_URL.isValid).toBe(true);
    expect(configured.API_URL.resolvedValue).toBe('https://api.example.com');
  });
});

it.each([{ AUTH_RATE_LIMIT_DISABLED: 'not-a-boolean' }, { PASSKEY_ANDROID_FINGERPRINTS: 'AB:CD' }])(
  'rejects invalid server auth settings %j',
  async (values) => {
    const items = await schema('server', {
      NODE_ENV: 'development',
      MOVIE_DB_ACCESS_TOKEN: 'fixture',
      ...values,
    });
    expect(Object.values(items).some((item) => !item.isValid)).toBe(true);
  },
);
