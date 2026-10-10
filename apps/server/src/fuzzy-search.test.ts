import { createSearchIndexReader } from '@movies/db/search-index';
import type { Database } from '@server/database';
import { createFuzzySearch } from '@server/fuzzy-search';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@movies/db/search-index', () => ({ createSearchIndexReader: vi.fn() }));

describe('native search database binding', () => {
  it('keeps a preview without a database on TMDB-only behavior', async () => {
    expect(await createFuzzySearch()('alien', { limit: 10 })).toEqual([]);
    expect(createSearchIndexReader).not.toHaveBeenCalled();
  });
  it('binds the shared pool to the canonical SQL reader and retains its lookup function', () => {
    const database = {} as Database;
    const lookup = vi.fn();
    vi.mocked(createSearchIndexReader).mockReturnValue({ searchIndexFuzzy: lookup });
    expect(createFuzzySearch(database)).toBe(lookup);
    expect(createSearchIndexReader).toHaveBeenCalledWith(database);
  });
});
