import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { delete: vi.fn(), insert: vi.fn(), select: vi.fn() } }));
vi.mock('@/lib/movies', () => ({ getMovieDetails: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ getTvShowDetails: vi.fn() }));
vi.mock('@/lib/imgproxy-url', () => ({ buildProxyImageUrls: vi.fn(() => ({ src: 'proxied' })) }));

import { watchlist } from '@/db/schema/watchlist';
import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';
import { getTvShowDetails } from '@/lib/tv-shows';
import { chain } from '@/test/db-chain';

import { ITEMS_PER_PAGE } from './config';
import {
  countCollectionRows,
  emptyCollectionPage,
  getCollectionPageWithDetails,
  hasCollectionRow,
  toggleCollectionRow,
} from './resource-collection';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('toggleCollectionRow', () => {
  it('returns "removed" when a row was deleted, without inserting', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([{ id: 'row-1' }]));

    const state = await toggleCollectionRow(watchlist, 'user-1', 5, 'movie');

    expect(state).toBe('removed');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('returns "added" when nothing was deleted and the insert landed', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([]));
    vi.mocked(db.insert).mockReturnValue(chain([{ id: 'row-1' }]));

    const state = await toggleCollectionRow(watchlist, 'user-1', 5, 'movie');

    expect(state).toBe('added');
  });

  it('returns "unchanged" when a concurrent insert won the race', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([]));
    vi.mocked(db.insert).mockReturnValue(chain([]));

    const state = await toggleCollectionRow(watchlist, 'user-1', 5, 'movie');

    expect(state).toBe('unchanged');
  });
});

describe('hasCollectionRow', () => {
  it('is true when a row matches', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ id: 'row-1' }]));

    await expect(hasCollectionRow(watchlist, 'user-1', 5, 'movie')).resolves.toBe(true);
  });

  it('is false when no row matches', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));

    await expect(hasCollectionRow(watchlist, 'user-1', 5, 'movie')).resolves.toBe(false);
  });
});

describe('countCollectionRows', () => {
  it('returns the row count', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ count: 3 }]));

    await expect(countCollectionRows(watchlist, 'user-1', 'movie')).resolves.toBe(3);
  });

  it('returns 0 when the count query yields no rows', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));

    await expect(countCollectionRows(watchlist, 'user-1', 'movie')).resolves.toBe(0);
  });
});

describe('emptyCollectionPage', () => {
  it('echoes the requested page with no items', () => {
    expect(emptyCollectionPage(4)).toEqual({
      items: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 4,
      itemsPerPage: ITEMS_PER_PAGE,
    });
  });
});

describe('getCollectionPageWithDetails', () => {
  it('short-circuits to an empty page when the collection has no rows', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ count: 0 }]));

    const page = await getCollectionPageWithDetails(watchlist, 'user-1', 'movie', 1);

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

    const page = await getCollectionPageWithDetails(watchlist, 'user-1', 'movie', 1);

    expect(page.totalItems).toBe(1);
    expect(page.items[0].resource).toEqual({
      title: 'Heat',
      poster_path: '/p.jpg',
      posterImageUrls: { src: 'proxied' },
    });
    expect(getTvShowDetails).not.toHaveBeenCalled();
  });

  it('fetches tv details for tv collections', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([{ count: 1 }]))
      .mockReturnValueOnce(chain([{ id: 'row-1', resourceId: 7, resourceType: 'tv' }]));
    vi.mocked(getTvShowDetails).mockResolvedValue({ name: 'Dark', poster_path: '/d.jpg' } as never);

    const page = await getCollectionPageWithDetails(watchlist, 'user-1', 'tv', 1);

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

    const page = await getCollectionPageWithDetails(watchlist, 'user-1', 'movie', 1);

    expect(page.items).toHaveLength(1);
    expect(page.totalItems).toBe(2);
  });
});
