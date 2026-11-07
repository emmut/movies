import { randomUUID } from 'node:crypto';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { popcorntimeLinks, popcorntimeSnapshots } from '@movies/db/schema/popcorntime';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/db', () => ({ db: { select: vi.fn() } }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn() }));

import { db as appDb } from '@/lib/db';
import { getPopcorntimeWatchLinks } from '@/lib/popcorntime';

import { importSnapshot } from './import';
import type { ImportedLink } from './rows';
import type { SnapshotManifest } from './snapshots';
import { replaceCountryLinks } from './store';

const connectionString = process.env.POPCORNTIME_TEST_DATABASE_URL;
const schema = `popcorntime_test_${randomUUID().replaceAll('-', '')}`;
const db = drizzle({ connection: { connectionString, max: 1 } });
const release = { version: 'test-release', publishedAt: new Date() };
const link: ImportedLink = {
  mediaType: 'movie',
  tmdbId: 123,
  region: 'SE',
  providerId: 8,
  offerType: 'flatrate',
  linkToken: '3xK9mPv2bQ7nRtYsABCDEFGHJKLMN',
};

describe.skipIf(!connectionString)('Popcorn Time PostgreSQL imports and lookups', () => {
  beforeAll(async () => {
    await db.execute(sql.raw(`CREATE SCHEMA ${schema}`));
    await db.execute(sql.raw(`SET search_path TO ${schema}`));
    const migration = await readFile(
      new URL('../../drizzle/0019_popcorntime_links.sql', import.meta.url),
      'utf8',
    );
    // The migration names the public schema in its foreign key. Use this
    // isolated test schema so this suite cannot touch application records.
    for (const statement of migration
      .replaceAll('"public".', `"${schema}".`)
      .split('--> statement-breakpoint')) {
      await db.execute(sql.raw(statement));
    }
    vi.mocked(appDb.select).mockImplementation(db.select.bind(db));
  });
  beforeEach(async () => {
    await db.execute(sql`TRUNCATE popcorntime_links, popcorntime_snapshots`);
  });
  afterAll(async () => {
    await db.execute(sql.raw(`DROP SCHEMA ${schema} CASCADE`));
    await db.$client.end();
  });

  it('atomically replaces one country, removes vanished links, and preserves other countries', async () => {
    await replaceCountryLinks(db, 'SE', release, [link]);
    await replaceCountryLinks(db, 'US', release, [{ ...link, region: 'US' }]);
    await replaceCountryLinks(db, 'SE', release, [{ ...link, tmdbId: 456 }]);
    const rows = await db.select().from(popcorntimeLinks);
    expect(rows.map((row) => `${row.region}/${row.tmdbId}`).sort()).toEqual(['SE/456', 'US/123']);
    expect(await db.select().from(popcorntimeSnapshots)).toHaveLength(2);
  });

  it('rolls back the whole country when a later insertion batch fails', async () => {
    await replaceCountryLinks(db, 'SE', release, [link]);
    const rows = Array.from({ length: 1001 }, (_, index) => ({ ...link, tmdbId: index + 1000 }));
    rows[1000].linkToken = null as unknown as string;
    await expect(
      replaceCountryLinks(db, 'SE', { ...release, version: 'broken-release' }, rows),
    ).rejects.toThrow();
    expect((await db.select().from(popcorntimeLinks)).map((row) => row.tmdbId)).toEqual([123]);
    expect((await db.select().from(popcorntimeSnapshots))[0].version).toBe(release.version);
  });

  it('refuses empty, mixed-country, and older replacements', async () => {
    await replaceCountryLinks(db, 'SE', release, [link]);
    await expect(replaceCountryLinks(db, 'SE', release, [])).rejects.toThrow('Invalid country');
    await expect(replaceCountryLinks(db, 'US', release, [link])).rejects.toThrow('Invalid country');
    await expect(
      replaceCountryLinks(db, 'SE', { ...release, publishedAt: new Date('2020-01-01') }, [link]),
    ).rejects.toThrow('newer');
    expect(await db.select().from(popcorntimeLinks)).toHaveLength(1);
  });

  it('looks up exact work types and excludes expired, future, and stale links', async () => {
    await replaceCountryLinks(db, 'SE', release, [
      link,
      { ...link, mediaType: 'tv' },
      { ...link, providerId: 2, offerType: 'rent', availableTo: '2020-01-01' },
      { ...link, providerId: 426, offerType: 'buy', availableFrom: '2099-01-01' },
    ]);
    const movie = await getPopcorntimeWatchLinks('movie', 123);
    expect(movie).toHaveLength(1);
    expect(movie[0].providerId).toBe(8);
    expect(await getPopcorntimeWatchLinks('tv', 123)).toHaveLength(1);
    expect(await getPopcorntimeWatchLinks('movie', 456)).toEqual([]);
    await replaceCountryLinks(db, 'US', { ...release, publishedAt: new Date('2020-01-01') }, [
      { ...link, region: 'US' },
    ]);
    expect((await getPopcorntimeWatchLinks('movie', 123)).map((row) => row.regions)).toEqual([
      ['SE'],
    ]);
  });

  it('imports real Parquet files, retries failed countries, and skips completed releases', async () => {
    const manifest: SnapshotManifest = {
      latest: 'fixture-release',
      published_at: new Date().toISOString(),
      countries: ['US', 'SE'],
      files: [],
    };
    const directory = await mkdtemp(join(tmpdir(), 'popcorntime-import-test-'));
    const download = vi.fn(
      async (_manifest: SnapshotManifest, path: string, destination: string) => {
        if (path === 'country=US/links.parquet') throw new Error('download failed');
        const filename = path.endsWith('media_details.parquet')
          ? 'media'
          : path.endsWith('providers.parquet')
            ? 'providers'
            : 'links';
        await copyFile(new URL(`./fixtures/${filename}.parquet`, import.meta.url), destination);
      },
    );
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await replaceCountryLinks(db, 'US', release, [{ ...link, region: 'US' }]);
      await expect(
        importSnapshot(db, { download }, manifest, directory, ['US', 'SE']),
      ).rejects.toThrow('failed for US');
      expect(
        (await db.select().from(popcorntimeLinks))
          .map((row) => `${row.region}/${row.mediaType}`)
          .sort(),
      ).toEqual(['SE/movie', 'SE/tv', 'US/movie']);
      download.mockClear();
      await importSnapshot(db, { download }, manifest, directory, ['SE']);
      expect(download).not.toHaveBeenCalled();
      await expect(
        importSnapshot(db, { download }, manifest, directory, ['US', 'SE']),
      ).rejects.toThrow('failed for US');
      expect(download.mock.calls.map(([, path]) => path)).not.toContain('country=SE/links.parquet');
      await expect(importSnapshot(db, { download }, manifest, directory, ['GB'])).rejects.toThrow(
        'no supported countries',
      );
    } finally {
      error.mockRestore();
      await rm(directory, { recursive: true, force: true });
    }
  });
});
