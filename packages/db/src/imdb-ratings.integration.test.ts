import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { createImdbRatingStore } from './imdb-ratings';

// A connection-local table shadows the shared table; fixtures never modify ingested ratings.
describe.skipIf(!process.env.IMDB_TEST_DATABASE_URL)('PostgreSQL IMDb ratings', () => {
  const client = new Client({ connectionString: process.env.IMDB_TEST_DATABASE_URL });
  const store = createImdbRatingStore(drizzle(client));
  beforeAll(async () => {
    await client.connect();
    await client.query(
      'CREATE TEMP TABLE imdb_ratings (imdb_id text PRIMARY KEY, rating numeric(3,1) NOT NULL, num_votes integer NOT NULL)',
    );
    await client.query(
      `INSERT INTO imdb_ratings VALUES ('tt0816692', 8.7, 2400000), ('tt0944947', 9.2, 2300000), ('tt0000001', 0, 0), ('tt0000002', 'NaN', 1)`,
    );
  });
  afterAll(async () => {
    await client.end();
  });
  it('reads the requested movie and TV rows independently', async () => {
    expect(await store.read('tt0816692')).toEqual({ rating: 8.7, numVotes: 2400000 });
    expect(await store.read('tt0944947')).toEqual({ rating: 9.2, numVotes: 2300000 });
  });
  it('retains zero-valued records', async () => {
    expect(await store.read('tt0000001')).toEqual({ rating: 0, numVotes: 0 });
  });
  it('returns null for absent or invalid IDs', async () => {
    expect(await store.read('tt9999999')).toBeNull();
    expect(await store.read('invalid')).toBeNull();
  });
  it('rejects PostgreSQL numeric NaN instead of exposing it to clients', async () => {
    await expect(store.read('tt0000002')).rejects.toThrow();
  });
});
