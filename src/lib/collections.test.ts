import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { select: vi.fn() } }));
vi.mock('@/lib/auth-server', () => ({ getUser: vi.fn() }));
vi.mock('@/lib/movies', () => ({ getMovieDetails: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ getTvShowDetails: vi.fn() }));
vi.mock('@/lib/imgproxy-url', () => ({ buildProxyImageUrls: vi.fn(() => ({ src: 'proxied' })) }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';
import { getTvShowDetails } from '@/lib/tv-shows';
import { chain } from '@/test/db-chain';

import { getCollectionCount, getCollectionPage, isInCollection } from './collections';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUser).mockResolvedValue({ id: 'user-1' } as never);
});

describe('isInCollection', () => {
  it('is false for anonymous visitors without querying', async () => {
    vi.mocked(getUser).mockResolvedValue(null as never);

    await expect(isInCollection('watchlist', 5, 'movie')).resolves.toBe(false);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('is true when a row matches', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ id: 'row-1' }]));

    await expect(isInCollection('watched', 5, 'movie')).resolves.toBe(true);
  });

  it('is false when no row matches', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));

    await expect(isInCollection('watchlist', 5, 'movie')).resolves.toBe(false);
  });

  it('is false on invalid input instead of throwing', async () => {
    await expect(isInCollection('watchlist', 0, 'movie')).resolves.toBe(false);
    await expect(isInCollection('watchlist', 1, 'person')).resolves.toBe(false);
    expect(db.select).not.toHaveBeenCalled();
  });
});

describe('getCollectionCount', () => {
  it('is 0 for anonymous visitors', async () => {
    vi.mocked(getUser).mockResolvedValue(null as never);

    await expect(getCollectionCount('watchlist', 'movie')).resolves.toBe(0);
  });

  it('returns the row count', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ count: 3 }]));

    await expect(getCollectionCount('watched', 'tv')).resolves.toBe(3);
  });

  it('degrades to 0 when the query fails', async () => {
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error('connection lost');
    });

    await expect(getCollectionCount('watchlist', 'movie')).resolves.toBe(0);
  });
});

describe('getCollectionPage', () => {
  it('rejects invalid input', async () => {
    await expect(getCollectionPage('watchlist', 'person' as never, 1)).rejects.toThrow();
    await expect(getCollectionPage('watchlist', 'movie', 0)).rejects.toThrow();
  });

  it('rejects anonymous visitors', async () => {
    vi.mocked(getUser).mockResolvedValue(null as never);

    await expect(getCollectionPage('watchlist', 'movie', 1)).rejects.toThrow(
      'User not authenticated',
    );
  });

  it('short-circuits to an empty page when the collection has no rows', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ count: 0 }]));

    const page = await getCollectionPage('watchlist', 'movie', 1);

    expect(page.items).toEqual([]);
    expect(page.totalItems).toBe(0);
    // Only the count query ran; no row page was fetched.
    expect(db.select).toHaveBeenCalledTimes(1);
  });

  it('augments movie rows with details and proxied poster urls', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([{ count: 1 }]))
      .mockReturnValueOnce(chain([{ id: 'row-1', resourceId: 5, resourceType: 'movie' }]));
    vi.mocked(getMovieDetails).mockResolvedValue({ title: 'Heat', poster_path: '/p.jpg' } as never);

    const page = await getCollectionPage('watchlist', 'movie', 1);

    expect(page.totalItems).toBe(1);
    expect(page.items[0].resource).toEqual({
      title: 'Heat',
      poster_path: '/p.jpg',
      posterImageUrls: { src: 'proxied' },
    });
    expect(getTvShowDetails).not.toHaveBeenCalled();
  });

  it('fetches tv details for tv pages', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([{ count: 1 }]))
      .mockReturnValueOnce(chain([{ id: 'row-1', resourceId: 7, resourceType: 'tv' }]));
    vi.mocked(getTvShowDetails).mockResolvedValue({ name: 'Dark', poster_path: '/d.jpg' } as never);

    const page = await getCollectionPage('watched', 'tv', 1);

    expect(page.items[0].resource).toMatchObject({ name: 'Dark' });
    expect(getMovieDetails).not.toHaveBeenCalled();
  });

  it('drops rows whose detail fetch fails instead of failing the page', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([{ count: 2 }]))
      .mockReturnValueOnce(
        chain([
          { id: 'row-1', resourceId: 5, resourceType: 'movie' },
          { id: 'row-2', resourceId: 6, resourceType: 'movie' },
        ]),
      );
    vi.mocked(getMovieDetails)
      .mockResolvedValueOnce({ title: 'Heat', poster_path: null } as never)
      .mockRejectedValueOnce(new Error('TMDB down'));

    const page = await getCollectionPage('watchlist', 'movie', 1);

    expect(page.items).toHaveLength(1);
    expect(page.totalItems).toBe(2);
  });

  it('degrades to an empty page when the database fails', async () => {
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error('connection lost');
    });

    const page = await getCollectionPage('watchlist', 'movie', 2);

    expect(page).toMatchObject({ items: [], totalItems: 0, currentPage: 2 });
  });
});
