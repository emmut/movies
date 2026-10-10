import { createSearchIndexReader } from '@movies/db/search-index';
import { createFuzzySearch } from '@server/fuzzy-search';
import { drizzle } from 'drizzle-orm/node-postgres';
import { describe, expect, it, vi } from 'vitest';

vi.mock('drizzle-orm/node-postgres', () => ({ drizzle: vi.fn() }));
vi.mock('@movies/db/search-index', () => ({ createSearchIndexReader: vi.fn() }));

describe('native search database binding', () => {
  it('keeps a preview without a database on TMDB-only behavior', async () => {
    expect(await createFuzzySearch()('alien', { limit: 10 })).toEqual([]);
    expect(drizzle).not.toHaveBeenCalled();
  });
  it('binds a bounded pool to the canonical SQL reader and retains its lookup function', () => {
    const database = {};
    const lookup = vi.fn();
    vi.mocked(drizzle).mockReturnValue(database as never);
    vi.mocked(createSearchIndexReader).mockReturnValue({ searchIndexFuzzy: lookup });
    expect(createFuzzySearch('postgres://localhost/movies', 4)).toBe(lookup);
    expect(drizzle).toHaveBeenCalledWith({
      connection: {
        connectionString: 'postgres://localhost/movies',
        max: 4,
        min: 1,
        keepAlive: true,
        idleTimeoutMillis: 300000,
        connectionTimeoutMillis: 60000,
      },
    });
    expect(createSearchIndexReader).toHaveBeenCalledWith(database);
  });
});
