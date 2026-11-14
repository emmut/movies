import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { internal } from 'varlock';
import { afterAll, describe, expect, it } from 'vite-plus/test';

const directory = mkdtempSync(join(tmpdir(), 'movies-web-env-'));
writeFileSync(
  join(directory, '.env.schema'),
  readFileSync(new URL('../../.env.schema', import.meta.url)),
);
const fixture = {
  NODE_ENV: 'test' as const,
  MOVIE_DB_ACCESS_TOKEN: 'private-movies-token-fixture',
  BETTER_AUTH_SECRET: 'private-auth-secret-fixture',
  DATABASE_URL: 'postgres://fixture:password@localhost/movies',
  DISCORD_CLIENT_ID: 'discord-client-fixture',
  DISCORD_CLIENT_SECRET: 'private-discord-fixture',
  GITHUB_CLIENT_ID: 'github-client-fixture',
  GITHUB_CLIENT_SECRET: 'private-github-fixture',
  IMGPROXY_KEY: 'private-imgproxy-key-fixture',
  IMGPROXY_SALT: 'private-imgproxy-salt-fixture',
  NEXT_PUBLIC_IMGPROXY_ENDPOINT: 'http://localhost:8080',
  NEXT_PUBLIC_IMGPROXY_BASE_URL: 'https://image.tmdb.org/t/p/original',
  NEXT_PUBLIC_POSTHOG_KEY: 'public-analytics-fixture',
  NEXT_PUBLIC_POSTHOG_HOST: 'https://eu.i.posthog.com',
  NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
};
async function load(overrides: Record<string, string | undefined> = {}) {
  const graph = await internal.loadEnvGraph({
    entryFilePaths: directory,
    overrideValues: { ...fixture, ...overrides },
    processEnvOverride: { NODE_ENV: 'test' },
    skipCache: true,
  });
  await graph.resolveEnvValues();
  return graph;
}

afterAll(() => rmSync(directory, { recursive: true, force: true }));

describe('web Varlock schema', () => {
  it('coerces defaults and separates secrets from browser configuration', async () => {
    const graph = await load();
    expect(graph.isInvalid).toBe(false);
    const values = graph.getResolvedEnvObject();
    expect(values.DB_POOL_MAX).toBe(3);
    expect(values.AUTH_RATE_LIMIT_DISABLED).toBe(false);
    expect(graph.configSchema.DB_POOL_MAX.isDynamic).toBe(true);
    expect(graph.configSchema.AUTH_RATE_LIMIT_DISABLED.isDynamic).toBe(true);
    expect(graph.configSchema.NEXT_PUBLIC_BASE_URL.isDynamic).toBe(false);
    expect(values.NEXT_PUBLIC_BASE_URL).toBe(fixture.NEXT_PUBLIC_BASE_URL);
    expect(graph.getSerializedGraph().config.NEXT_PUBLIC_BASE_URL.isSensitive).toBe(false);
    for (const key of ['MOVIE_DB_ACCESS_TOKEN', 'BETTER_AUTH_SECRET', 'GITHUB_CLIENT_SECRET']) {
      expect(graph.getSerializedGraph().config[key].isSensitive).toBe(true);
    }
  });
  it.each([
    { DB_POOL_MAX: '0' },
    { DB_POOL_MAX: '1.5' },
    { AUTH_RATE_LIMIT_DISABLED: 'not-a-boolean' },
    { PASSKEY_APPLE_TEAM_ID: 'invalid' },
    { PASSKEY_ANDROID_FINGERPRINTS: 'AB:CD' },
    { TMDB_API_URL_OVERRIDE: 'ftp://localhost' },
  ])('rejects invalid configuration %j', async (input) => {
    expect((await load(input)).isInvalid).toBe(true);
  });
  it('accepts configured passkey identities and typed overrides', async () => {
    const graph = await load({
      PASSKEY_APPLE_TEAM_ID: 'AB12CD34EF',
      PASSKEY_ANDROID_FINGERPRINTS: 'ab'.repeat(32) + ', ' + Array(32).fill('CD').join(':'),
      AUTH_RATE_LIMIT_DISABLED: 'true',
      DB_POOL_MAX: '7',
    });
    expect(graph.isInvalid).toBe(false);
    expect(graph.getResolvedEnvObject()).toMatchObject({
      DB_POOL_MAX: 7,
      AUTH_RATE_LIMIT_DISABLED: true,
    });
  });
});
