import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { select: vi.fn() } }));
vi.mock('@/lib/auth-server', () => ({ getUser: vi.fn() }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('@/lib/movies', () => ({ getMovieDetails: vi.fn(), getMovieWatchProviders: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({
  getTvShowDetails: vi.fn(),
  getTvShowWatchProviders: vi.fn(),
}));
vi.mock('@/lib/imgproxy-url', () => ({ buildProxyImageUrls: vi.fn(() => ({ src: 'proxied' })) }));
vi.mock('@/lib/title-sync-server', () => ({ appTitleSource: {} }));
// The provider filter itself is a SQL predicate (covered by
// watch-provider-availability.test.ts); only the lazy sync is stubbed here.
vi.mock('@/lib/watch-provider-availability', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/watch-provider-availability')>();
  return { ...actual, ensureAvailabilityKnown: vi.fn() };
});

import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';
import { getTvShowDetails } from '@/lib/tv-shows';
import { ensureAvailabilityKnown } from '@/lib/watch-provider-availability';
import { chain } from '@/test/db-chain';

import {
  getSystemListCount,
  getSystemListMemberships,
  getSystemListWithResourceDetailsPaginated,
  isResourceInSystemList,
} from './system-list-queries';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUser).mockResolvedValue({ id: 'user-1' } as never);
});

describe('isResourceInSystemList', () => {
  it('returns false when unauthenticated without querying', async () => {
    vi.mocked(getUser).mockResolvedValue(null as never);

    await expect(isResourceInSystemList('watchlist', 5, 'movie')).resolves.toBe(false);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('returns true when the item is in the list', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ id: 'item-1' }]));

    await expect(isResourceInSystemList('watched', 5, 'movie')).resolves.toBe(true);
  });

  it('returns false when the item is not in the list', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));

    await expect(isResourceInSystemList('watchlist', 5, 'tv')).resolves.toBe(false);
  });

  it('returns false on invalid input instead of throwing', async () => {
    await expect(isResourceInSystemList('watchlist', 0, 'movie')).resolves.toBe(false);
  });
});

describe('getSystemListMemberships', () => {
  it('reports membership of both system lists', async () => {
    // First select: watchlist membership hit; second: watched membership miss.
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([{ id: 'item-1' }]))
      .mockReturnValueOnce(chain([]));

    await expect(getSystemListMemberships(5, 'movie')).resolves.toEqual({
      inWatchlist: true,
      watched: false,
    });
  });

  it('reports false for both lists when unauthenticated', async () => {
    vi.mocked(getUser).mockResolvedValue(null as never);

    await expect(getSystemListMemberships(5, 'movie')).resolves.toEqual({
      inWatchlist: false,
      watched: false,
    });
    expect(db.select).not.toHaveBeenCalled();
  });
});

describe('getSystemListCount', () => {
  it('returns 0 when unauthenticated without querying', async () => {
    vi.mocked(getUser).mockResolvedValue(null as never);

    await expect(getSystemListCount('watchlist', 'movie')).resolves.toBe(0);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('returns the count for the resource type', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ count: 3 }]));

    await expect(getSystemListCount('watched', 'movie')).resolves.toBe(3);
  });

  it('returns 0 when the query fails', async () => {
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error('connection lost');
    });

    await expect(getSystemListCount('watchlist', 'movie')).resolves.toBe(0);
  });
});

describe('getSystemListWithResourceDetailsPaginated', () => {
  it('rejects an invalid resource type', async () => {
    await expect(
      getSystemListWithResourceDetailsPaginated('watchlist', 'person' as never),
    ).rejects.toThrow('Invalid resource type or page number');
  });

  it('rejects an invalid list type', async () => {
    await expect(
      getSystemListWithResourceDetailsPaginated('favorites' as never, 'movie'),
    ).rejects.toThrow();
  });

  it('rejects when unauthenticated', async () => {
    vi.mocked(getUser).mockResolvedValue(null as never);

    await expect(getSystemListWithResourceDetailsPaginated('watchlist', 'movie')).rejects.toThrow(
      'User not authenticated',
    );
  });

  it('returns an empty page when the list is empty', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ count: 0 }]));

    await expect(getSystemListWithResourceDetailsPaginated('watched', 'movie')).resolves.toEqual({
      items: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      itemsPerPage: expect.any(Number),
    });
  });

  it('hydrates movie rows with resource details', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([{ count: 1 }]))
      .mockReturnValueOnce(
        chain([{ id: 'item-1', resourceId: 5, resourceType: 'movie', createdAt: new Date(0) }]),
      );
    vi.mocked(getMovieDetails).mockResolvedValue({ id: 5, poster_path: '/p.jpg' } as never);

    const result = await getSystemListWithResourceDetailsPaginated('watchlist', 'movie');

    expect(result.totalItems).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 5,
      listItemId: 'item-1',
      resourceType: 'movie',
      posterImageUrls: { src: 'proxied' },
    });
  });

  it('drops rows whose details fetch fails instead of failing the page', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([{ count: 2 }]))
      .mockReturnValueOnce(
        chain([
          { id: 'item-1', resourceId: 5, resourceType: 'tv', createdAt: new Date(0) },
          { id: 'item-2', resourceId: 6, resourceType: 'tv', createdAt: new Date(1) },
        ]),
      );
    vi.mocked(getTvShowDetails)
      .mockResolvedValueOnce({ id: 5, poster_path: '/p.jpg' } as never)
      .mockRejectedValueOnce(new Error('tmdb down'));

    const result = await getSystemListWithResourceDetailsPaginated('watched', 'tv');

    expect(result.totalItems).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].listItemId).toBe('item-1');
  });

  it('returns an empty page when the query fails', async () => {
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error('connection lost');
    });

    const result = await getSystemListWithResourceDetailsPaginated('watchlist', 'movie');

    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
  });
});

describe('getSystemListWithResourceDetailsPaginated with a provider filter', () => {
  const streamableRow = {
    id: 'item-1',
    resourceId: 1,
    resourceType: 'movie',
    createdAt: new Date(0),
  };

  beforeEach(() => {
    vi.mocked(ensureAvailabilityKnown).mockResolvedValue(0);
    vi.mocked(getMovieDetails).mockImplementation(
      async (movieId: number) => ({ id: movieId, poster_path: null }) as never,
    );
  });

  /** Stubs, in order: the filtered count, then the page rows (skipped when nothing matches). */
  function stubFilteredQueries(matching: (typeof streamableRow)[]) {
    const select = vi.mocked(db.select).mockReturnValueOnce(chain([{ count: matching.length }]));
    if (matching.length > 0) {
      select.mockReturnValueOnce(chain(matching));
    }
  }

  it('pages the SQL-filtered rows', async () => {
    stubFilteredQueries([streamableRow]);

    const result = await getSystemListWithResourceDetailsPaginated(
      'watchlist',
      'movie',
      1,
      [8],
      'SE',
    );

    expect(result.items.map((item) => item.id)).toEqual([1]);
    expect(result.totalItems).toBe(1);
    expect(result.totalPages).toBe(1);
    // Count and page query, both filtered in SQL.
    expect(db.select).toHaveBeenCalledTimes(2);
  });

  it('syncs titles that predate the cache before filtering', async () => {
    stubFilteredQueries([streamableRow]);

    await getSystemListWithResourceDetailsPaginated('watchlist', 'movie', 1, [8], 'SE');

    expect(ensureAvailabilityKnown).toHaveBeenCalledTimes(1);
  });

  it('returns an empty page when nothing matches the filter', async () => {
    stubFilteredQueries([]);

    const result = await getSystemListWithResourceDetailsPaginated(
      'watched',
      'movie',
      1,
      [999],
      'SE',
    );

    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(getMovieDetails).not.toHaveBeenCalled();
    expect(db.select).toHaveBeenCalledTimes(1);
  });

  it('clamps an out-of-range page to the last filtered page', async () => {
    stubFilteredQueries([streamableRow]);

    const result = await getSystemListWithResourceDetailsPaginated(
      'watchlist',
      'movie',
      7,
      [8],
      'SE',
    );

    expect(result.currentPage).toBe(1);
  });

  it('skips the availability cache when the filter is empty', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([{ count: 1 }]))
      .mockReturnValueOnce(chain([streamableRow]));

    const result = await getSystemListWithResourceDetailsPaginated('watchlist', 'movie', 1, []);

    expect(result.totalItems).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(ensureAvailabilityKnown).not.toHaveBeenCalled();
  });

  it('rejects an unknown watch region before querying', async () => {
    await expect(
      getSystemListWithResourceDetailsPaginated('watchlist', 'movie', 1, [8], 'XX'),
    ).rejects.toThrow();
    expect(db.select).not.toHaveBeenCalled();
  });

  it('propagates availability sync failures instead of returning an empty page', async () => {
    vi.mocked(ensureAvailabilityKnown).mockRejectedValue(new Error('TMDB down'));

    // An empty page here would render as "no titles match your providers".
    await expect(
      getSystemListWithResourceDetailsPaginated('watchlist', 'movie', 1, [8], 'SE'),
    ).rejects.toThrow('TMDB down');
  });
});
