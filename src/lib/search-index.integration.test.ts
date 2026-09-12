import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { transaction: vi.fn() } }));
vi.mock('@/lib/movies', () => ({ getMovieDetails: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ getTvShowDetails: vi.fn() }));
vi.mock('@/lib/persons', () => ({ getPersonDetails: vi.fn() }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('./tmdb', () => ({
  tmdbFetch: vi.fn(),
  addPosterImageUrls: vi.fn((item: object) => item),
  addProfileImageUrls: vi.fn((item: object) => item),
}));

import { searchIndex } from '@/db/schema/search-index';
import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';

import { getSearchMovies, getSearchMulti, getSearchSuggestions } from './search';
import { FUZZY_QUERY_TIMEOUT_MS, searchIndexFuzzy } from './search-index';
import { tmdbFetch } from './tmdb';

// Run against a migrated PostgreSQL database. Temporary tables keep fixtures
// isolated from both existing titles and other test connections.
describe.skipIf(!process.env.SEARCH_TEST_DATABASE_URL)('PostgreSQL fuzzy search', () => {
  const client = new Client({ connectionString: process.env.SEARCH_TEST_DATABASE_URL });
  const database = drizzle(client);

  beforeAll(async () => {
    await client.connect();
    await client.query('CREATE TEMP TABLE search_index (LIKE public.search_index INCLUDING ALL)');
    await database.insert(searchIndex).values([
      {
        tmdbId: 157336,
        mediaType: 'movie',
        title: 'Interstellar',
        searchTitle: 'interstellar',
        popularity: 120,
      },
      {
        tmdbId: 157336,
        mediaType: 'person',
        title: 'Martin Walker',
        searchTitle: 'martin walker',
        popularity: 1,
      },
      {
        tmdbId: 99,
        mediaType: 'movie',
        title: 'Interstate',
        searchTitle: 'interstate',
        popularity: 1,
      },
      {
        tmdbId: 100,
        mediaType: 'tv',
        title: 'Interstellar TV',
        searchTitle: 'interstellar tv',
        popularity: 1,
      },
    ]);
    vi.mocked(db.transaction).mockImplementation(database.transaction.bind(database));
    vi.mocked(tmdbFetch).mockResolvedValue({
      results: [],
      total_pages: 0,
      total_results: 0,
    } as never);
    vi.mocked(getMovieDetails).mockImplementation(async (id) => {
      return { id, title: id === 157336 ? 'Interstellar' : 'Interstate', genres: [] } as never;
    });
  });

  afterAll(async () => {
    await client.end();
  });

  it('returns Interstellar for intersteller through the search page and palette', async () => {
    for (const search of [getSearchMulti, getSearchSuggestions]) {
      const result = await search('intersteller');
      expect(result.results[0]).toMatchObject({
        id: 157336,
        title: 'Interstellar',
        media_type: 'movie',
      });
    }
    const result = await getSearchMovies('intersteller');
    expect(result.movies[0]).toMatchObject({ id: 157336, title: 'Interstellar' });
  });

  it('matches prefixes and keeps the media type restriction', async () => {
    const hits = await searchIndexFuzzy('interst', { mediaType: 'movie', limit: 8 });
    expect(hits[0]).toMatchObject({ tmdbId: 157336, title: 'Interstellar' });
    expect(hits.every((hit) => hit.mediaType === 'movie')).toBe(true);
  });

  it('uses a GIN index from the migrations', async () => {
    const result = await client.query(
      "SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'search_index_search_title_trgm_idx'",
    );
    expect(result.rows[0].indexdef).toContain('USING gin (search_title gin_trgm_ops)');
  });

  it('cancels overdue SQL on the server and resets the pooled connection settings', async () => {
    vi.mocked(db.transaction).mockImplementationOnce(async (callback) => {
      return await database.transaction(async (tx) => {
        const execute = tx.execute.bind(tx);
        let calls = 0;
        vi.spyOn(tx, 'execute').mockImplementation((query) => {
          calls += 1;
          return execute(calls === 2 ? sql`select pg_sleep(10)` : query);
        });
        return await callback(tx);
      });
    });

    const started = performance.now();
    await searchIndexFuzzy('intersteller', { limit: 8 }).catch(() => []);
    // This waits for rollback on the same connection. A caller-only timeout
    // would leave pg_sleep running for ten seconds and fail this assertion.
    await expect(vi.mocked(db.transaction).mock.results.at(-1)?.value).rejects.toMatchObject({
      cause: { code: '57014' },
    });
    const result = await client.query('SHOW statement_timeout');
    expect(performance.now() - started).toBeLessThan(FUZZY_QUERY_TIMEOUT_MS + 1500);
    expect(result.rows[0].statement_timeout).toBe('0');
  });
});
