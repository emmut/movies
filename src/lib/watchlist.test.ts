import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { select: vi.fn() } }));
vi.mock('@/lib/auth-server', () => ({ getUser: vi.fn() }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('@/lib/movies', () => ({ getMovieDetails: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ getTvShowDetails: vi.fn() }));
vi.mock('@/lib/imgproxy-url', () => ({ buildProxyImageUrls: vi.fn(() => ({ src: 'proxied' })) }));

import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';

import { chain } from '@/test/db-chain';

import {
  getWatchlistCount,
  getWatchlistWithResourceDetailsPaginated,
  isResourceInWatchlist,
} from './watchlist';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUser).mockResolvedValue({ id: 'user-1' } as never);
});

describe('isResourceInWatchlist', () => {
  it('returns false when unauthenticated without querying', async () => {
    vi.mocked(getUser).mockResolvedValue(null as never);

    await expect(isResourceInWatchlist(5, 'movie')).resolves.toBe(false);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('returns true when the item is in the watchlist', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ id: 'item-1' }]));

    await expect(isResourceInWatchlist(5, 'movie')).resolves.toBe(true);
  });

  it('returns false when the item is not in the watchlist', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));

    await expect(isResourceInWatchlist(5, 'tv')).resolves.toBe(false);
  });

  it('returns false on invalid input instead of throwing', async () => {
    await expect(isResourceInWatchlist(0, 'movie')).resolves.toBe(false);
  });
});

describe('getWatchlistCount', () => {
  it('returns 0 when unauthenticated without querying', async () => {
    vi.mocked(getUser).mockResolvedValue(null as never);

    await expect(getWatchlistCount('movie')).resolves.toBe(0);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('returns the count for the resource type', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ count: 3 }]));

    await expect(getWatchlistCount('movie')).resolves.toBe(3);
  });

  it('returns 0 when the query fails', async () => {
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error('connection lost');
    });

    await expect(getWatchlistCount('movie')).resolves.toBe(0);
  });
});

describe('getWatchlistWithResourceDetailsPaginated', () => {
  it('rejects an invalid resource type', async () => {
    await expect(
      getWatchlistWithResourceDetailsPaginated('person' as never),
    ).rejects.toThrow('Invalid resource type or page number');
  });

  it('rejects when unauthenticated', async () => {
    vi.mocked(getUser).mockResolvedValue(null as never);

    await expect(getWatchlistWithResourceDetailsPaginated('movie')).rejects.toThrow(
      'User not authenticated',
    );
  });

  it('returns an empty page when the watchlist is empty', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ count: 0 }]));

    await expect(getWatchlistWithResourceDetailsPaginated('movie')).resolves.toEqual({
      items: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      itemsPerPage: expect.any(Number),
    });
  });

  it('hydrates rows with resource details', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([{ count: 1 }]))
      .mockReturnValueOnce(
        chain([{ id: 'item-1', resourceId: 5, resourceType: 'movie', createdAt: new Date(0) }]),
      );
    vi.mocked(getMovieDetails).mockResolvedValue({ id: 5, poster_path: '/p.jpg' } as never);

    const result = await getWatchlistWithResourceDetailsPaginated('movie');

    expect(result.totalItems).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'item-1',
      resourceType: 'movie',
      resource: { id: 5, posterImageUrls: { src: 'proxied' } },
    });
  });

  it('returns an empty page when the query fails', async () => {
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error('connection lost');
    });

    const result = await getWatchlistWithResourceDetailsPaginated('movie');

    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
  });
});
