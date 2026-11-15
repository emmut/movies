import { fileURLToPath } from 'node:url';

import { internal } from 'varlock';
import { describe, expect, it } from 'vite-plus/test';

async function schema(app: string, values: Record<string, string>) {
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
    expect(items.AUTH_URL.isValid).toBe(false);
    expect(items.AUTH_PROXY_SECRET.isValid).toBe(false);
  });
  it('requires a signing secret when development enables auth', async () => {
    const items = await schema('server', {
      NODE_ENV: 'development',
      MOVIE_DB_ACCESS_TOKEN: 'fixture',
      AUTH_URL: 'http://localhost:3000',
    });
    expect(items.AUTH_URL.isValid).toBe(true);
    expect(items.AUTH_PROXY_SECRET.isValid).toBe(false);
  });
  it('requires canonical auth when a callback URL is configured', async () => {
    const items = await schema('server', {
      NODE_ENV: 'development',
      MOVIE_DB_ACCESS_TOKEN: 'fixture',
      WEB_URL: 'http://localhost:3000',
    });
    expect(items.AUTH_URL.isValid).toBe(false);
  });
  it('permits public-only local previews and validates configured accounts', async () => {
    const publicItems = await schema('server', {
      NODE_ENV: 'development',
      MOVIE_DB_ACCESS_TOKEN: 'fixture',
    });
    expect(publicItems.AUTH_URL.isValid).toBe(true);
    expect(publicItems.AUTH_PROXY_SECRET.isValid).toBe(true);
    const accountItems = await schema('server', {
      NODE_ENV: 'production',
      MOVIE_DB_ACCESS_TOKEN: 'fixture',
      AUTH_URL: 'https://web.example.com',
      AUTH_PROXY_SECRET: 'a-fixture-secret-of-at-least-32-characters',
    });
    expect(accountItems.AUTH_URL.isValid).toBe(true);
    expect(accountItems.AUTH_PROXY_SECRET.isValid).toBe(true);
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
