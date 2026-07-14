import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: { select: vi.fn() },
}));
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

import { db } from '@/lib/db';
import { chain } from '@/test/db-chain';

import { getImdbRating } from './imdb';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getImdbRating', () => {
  it('returns null for a missing imdb id without querying', async () => {
    await expect(getImdbRating(null)).resolves.toBeNull();
    await expect(getImdbRating(undefined)).resolves.toBeNull();
    await expect(getImdbRating('')).resolves.toBeNull();
    expect(db.select).not.toHaveBeenCalled();
  });

  it('converts the numeric column to a number on a hit', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ rating: '9.3', numVotes: 3021762 }]));
    await expect(getImdbRating('tt0111161')).resolves.toEqual({
      rating: 9.3,
      numVotes: 3021762,
    });
  });

  it('returns null when the title has no ingested rating', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));
    await expect(getImdbRating('tt9999999')).resolves.toBeNull();
  });

  it('degrades to null instead of throwing when the query fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error('relation "imdb_ratings" does not exist');
    });
    await expect(getImdbRating('tt0111161')).resolves.toBeNull();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
