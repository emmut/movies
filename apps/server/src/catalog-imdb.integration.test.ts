import { createImdbRatingStore } from '@movies/db/imdb-ratings';
import { createApp } from '@server/app';
import { createCatalogService } from '@server/catalog-service';
import { createTestClient, mockServices } from '@server/test-services';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

describe.skipIf(!process.env.IMDB_TEST_DATABASE_URL)('PostgreSQL-backed IMDb RPC', () => {
  const client = new Client({ connectionString: process.env.IMDB_TEST_DATABASE_URL });
  const store = createImdbRatingStore(drizzle(client));
  // Identity mapping is deterministic; Hono, oRPC, Drizzle and PostgreSQL are real.
  const fetcher = vi.fn().mockImplementation(async (path: string) => ({
    imdb_id: path.startsWith('/movie/') ? 'tt0816692' : 'tt0944947',
  }));
  const catalog = createCatalogService(fetcher, { readRating: store.read });
  const rpc = createTestClient(createApp(mockServices({ catalog })));

  beforeAll(async () => {
    await client.connect();
    await client.query(
      'CREATE TEMP TABLE imdb_ratings (imdb_id text PRIMARY KEY, rating numeric(3,1) NOT NULL, num_votes integer NOT NULL)',
    );
    await client.query(
      `INSERT INTO imdb_ratings VALUES ('tt0816692', 8.7, 2400000), ('tt0944947', 9.2, 2300000)`,
    );
  });
  afterAll(async () => {
    await client.end();
  });

  it.each([
    { id: 157336, type: 'movie' as const, imdbId: 'tt0816692', rating: 8.7, numVotes: 2400000 },
    { id: 1399, type: 'tv' as const, imdbId: 'tt0944947', rating: 9.2, numVotes: 2300000 },
  ])(
    'returns the stored rating through Hono for $type',
    async ({ id, type, imdbId, rating, numVotes }) => {
      expect(await rpc.catalog.imdb({ id, type })).toEqual({
        url: `https://www.imdb.com/title/${imdbId}/`,
        rating: { rating, numVotes },
        ratingUnavailable: false,
      });
    },
  );
  it('retains the source link when an ingested row is absent', async () => {
    await client.query('DELETE FROM imdb_ratings WHERE imdb_id = $1', ['tt0816692']);
    expect(await rpc.catalog.imdb({ id: 157336, type: 'movie' })).toEqual({
      url: 'https://www.imdb.com/title/tt0816692/',
      rating: null,
      ratingUnavailable: false,
    });
  });
  it('reports corrupt database values as unavailable without exposing NaN or details', async () => {
    await client.query('UPDATE imdb_ratings SET rating = $1 WHERE imdb_id = $2', [
      'NaN',
      'tt0944947',
    ]);
    expect(await rpc.catalog.imdb({ id: 1399, type: 'tv' })).toEqual({
      url: 'https://www.imdb.com/title/tt0944947/',
      rating: null,
      ratingUnavailable: true,
    });
  });
});
