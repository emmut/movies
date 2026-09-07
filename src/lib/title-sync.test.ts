import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { chain } from '@/test/db-chain';
import type { MovieDetails } from '@/types/movie';
import type { TvDetails } from '@/types/tv-show';
import type { WatchProvider } from '@/types/watch-provider';

import {
  availabilityRows,
  AVAILABILITY_MAX_AGE_MS,
  isTitleMediaType,
  mapWithConcurrency,
  movieTitleRow,
  pruneOrphanTitles,
  replaceTitleAvailability,
  selectTitlesNeedingAvailability,
  selectTitlesNeedingDetails,
  staleBefore,
  syncTitle,
  syncTitleAvailability,
  syncTitleDetails,
  TITLE_DETAILS_MAX_AGE_MS,
  type TitleSource,
  tvTitleRow,
  upsertTitle,
} from './title-sync';
import { TmdbRequestError } from './tmdb-fetch';

function offer(id: number): WatchProvider {
  return {
    provider_id: id,
    provider_name: `Provider ${id}`,
    logo_path: '/logo.png',
    display_priority: 1,
  };
}

const movie = {
  id: 550,
  title: 'Fight Club',
  poster_path: '/fc.jpg',
  release_date: '1999-10-15',
  vote_average: 8.4,
  runtime: 139,
  genres: [{ id: 18, name: 'Drama' }],
} as MovieDetails;

const show = {
  id: 1396,
  name: 'Breaking Bad',
  poster_path: '/bb.jpg',
  first_air_date: '2008-01-20',
  vote_average: 8.9,
  episode_run_time: [45, 47],
  genres: [
    { id: 18, name: 'Drama' },
    { id: 80, name: 'Crime' },
  ],
} as TvDetails;

/**
 * A db mock whose transaction callback runs against the same mock, so the
 * statements inside `replaceTitleAvailability` are observable.
 */
function mockDatabase() {
  const insert = vi.fn(() => chain(undefined));
  const del = vi.fn(() => chain([]));
  const selectDistinct = vi.fn(() => chain([]));
  const database = {
    insert,
    delete: del,
    selectDistinct,
    transaction: vi.fn((fn: (tx: unknown) => Promise<void>) => fn(database)),
  };
  return { database: database as unknown as NodePgDatabase, insert, delete: del, selectDistinct };
}

function mockSource(overrides: Partial<TitleSource> = {}): TitleSource {
  return {
    movieDetails: vi.fn().mockResolvedValue(movie),
    tvDetails: vi.fn().mockResolvedValue(show),
    movieWatchProviders: vi.fn().mockResolvedValue({ results: {} }),
    tvWatchProviders: vi.fn().mockResolvedValue({ results: {} }),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('isTitleMediaType', () => {
  it('accepts movie and tv, rejects person and junk', () => {
    expect(isTitleMediaType('movie')).toBe(true);
    expect(isTitleMediaType('tv')).toBe(true);
    expect(isTitleMediaType('person')).toBe(false);
    expect(isTitleMediaType('')).toBe(false);
  });
});

describe('staleBefore', () => {
  it('subtracts the max age from now', () => {
    const now = new Date('2026-09-04T04:00:00Z');
    expect(staleBefore(60_000, now)).toEqual(new Date('2026-09-04T03:59:00Z'));
  });

  it('keeps a nightly run refreshing yesterday’s rows', () => {
    // Refreshed at 04:05 yesterday, checked at 04:00 today: a full 24h window
    // would skip it; the shorter window must not.
    const refreshedAt = new Date('2026-09-03T04:05:00Z');
    const now = new Date('2026-09-04T04:00:00Z');
    expect(refreshedAt < staleBefore(AVAILABILITY_MAX_AGE_MS, now)).toBe(true);
    expect(TITLE_DETAILS_MAX_AGE_MS).toBeLessThan(7 * 24 * 60 * 60 * 1000);
  });
});

describe('movieTitleRow', () => {
  it('maps TMDB movie details to a titles row', () => {
    expect(movieTitleRow(movie)).toEqual({
      mediaType: 'movie',
      tmdbId: 550,
      title: 'Fight Club',
      posterPath: '/fc.jpg',
      releaseDate: '1999-10-15',
      voteAverage: 8.4,
      runtime: 139,
      genreIds: [18],
    });
  });

  it('nulls blank optional fields and a zero runtime', () => {
    const row = movieTitleRow({
      ...movie,
      poster_path: '',
      release_date: '',
      runtime: 0,
      genres: undefined,
      vote_average: undefined,
    } as unknown as MovieDetails);

    expect(row).toMatchObject({
      posterPath: null,
      releaseDate: null,
      runtime: null,
      genreIds: [],
      voteAverage: 0,
    });
  });
});

describe('tvTitleRow', () => {
  it('maps TMDB TV details to a titles row using the first episode runtime', () => {
    expect(tvTitleRow(show)).toEqual({
      mediaType: 'tv',
      tmdbId: 1396,
      title: 'Breaking Bad',
      posterPath: '/bb.jpg',
      releaseDate: '2008-01-20',
      voteAverage: 8.9,
      runtime: 45,
      genreIds: [18, 80],
    });
  });

  it('nulls the runtime when TMDB reports none', () => {
    expect(tvTitleRow({ ...show, episode_run_time: [] }).runtime).toBeNull();
    expect(
      tvTitleRow({ ...show, episode_run_time: undefined } as unknown as TvDetails).runtime,
    ).toBeNull();
  });
});

describe('availabilityRows', () => {
  const key = { mediaType: 'movie' as const, tmdbId: 1 };

  it('flattens every offer type for the supported regions', () => {
    const rows = availabilityRows(
      key,
      {
        results: {
          SE: { link: 'x', flatrate: [offer(8)], rent: [offer(2)] },
          US: { link: 'x', free: [offer(9)], buy: [offer(2)] },
        },
      },
      ['SE', 'US'],
    );

    expect(rows).toEqual([
      { ...key, region: 'SE', providerId: 8, offerType: 'flatrate' },
      { ...key, region: 'SE', providerId: 2, offerType: 'rent' },
      { ...key, region: 'US', providerId: 9, offerType: 'free' },
      { ...key, region: 'US', providerId: 2, offerType: 'buy' },
    ]);
  });

  it('ignores regions the app does not support', () => {
    const rows = availabilityRows(key, { results: { BR: { link: 'x', flatrate: [offer(8)] } } }, [
      'SE',
    ]);

    expect(rows).toEqual([]);
  });

  it('collapses duplicate offers so the primary key cannot trip', () => {
    const rows = availabilityRows(
      key,
      { results: { SE: { link: 'x', flatrate: [offer(8), offer(8)] } } },
      ['SE'],
    );

    expect(rows).toHaveLength(1);
  });

  it('defaults to every supported region and tolerates a missing results object', () => {
    expect(availabilityRows(key, {} as never)).toEqual([]);
    expect(
      availabilityRows(key, { results: { SE: { link: 'x', flatrate: [offer(8)] } } }),
    ).toHaveLength(1);
  });
});

describe('upsertTitle', () => {
  it('upserts on the (media_type, tmdb_id) key, refreshing every field', async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn(() => ({ onConflictDoUpdate }));
    const database = { insert: vi.fn(() => ({ values })) } as unknown as NodePgDatabase;

    await upsertTitle(database, movieTitleRow(movie));

    expect(values).toHaveBeenCalledWith(movieTitleRow(movie));
    expect(onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({
          title: expect.anything(),
          voteAverage: expect.anything(),
          fetchedAt: expect.anything(),
        }),
      }),
    );
  });
});

describe('replaceTitleAvailability', () => {
  const key = { mediaType: 'tv' as const, tmdbId: 7 };

  it('stamps the marker, clears old offers, and inserts the new set in one transaction', async () => {
    const { database, insert, delete: del } = mockDatabase();
    const rows = [{ ...key, region: 'SE', providerId: 8, offerType: 'flatrate' as const }];

    await replaceTitleAvailability(database, key, rows);

    expect(database.transaction).toHaveBeenCalledTimes(1);
    // Marker upsert, then offers insert.
    expect(insert).toHaveBeenCalledTimes(2);
    expect(del).toHaveBeenCalledTimes(1);
  });

  it('skips the offers insert for an empty set but still records the sync', async () => {
    const { database, insert, delete: del } = mockDatabase();

    await replaceTitleAvailability(database, key, []);

    expect(insert).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledTimes(1);
  });
});

describe('syncTitleDetails', () => {
  it('fetches movie details and upserts the row', async () => {
    const { database, insert } = mockDatabase();
    const source = mockSource();

    await expect(
      syncTitleDetails(database, source, { mediaType: 'movie', tmdbId: 550 }),
    ).resolves.toBe('synced');
    expect(source.movieDetails).toHaveBeenCalledWith(550);
    expect(source.tvDetails).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('fetches TV details through the TV endpoint', async () => {
    const { database } = mockDatabase();
    const source = mockSource();

    await syncTitleDetails(database, source, { mediaType: 'tv', tmdbId: 1396 });

    expect(source.tvDetails).toHaveBeenCalledWith(1396);
    expect(source.movieDetails).not.toHaveBeenCalled();
  });

  it('reports a title TMDB no longer has as gone without writing', async () => {
    const { database, insert } = mockDatabase();
    const source = mockSource({
      movieDetails: vi.fn().mockRejectedValue(new TmdbRequestError('nope', 404)),
    });

    await expect(
      syncTitleDetails(database, source, { mediaType: 'movie', tmdbId: 1 }),
    ).resolves.toBe('gone');
    expect(insert).not.toHaveBeenCalled();
  });

  it('propagates other failures', async () => {
    const { database } = mockDatabase();
    const source = mockSource({
      movieDetails: vi.fn().mockRejectedValue(new TmdbRequestError('down', 503)),
    });

    await expect(
      syncTitleDetails(database, source, { mediaType: 'movie', tmdbId: 1 }),
    ).rejects.toThrow('down');
  });
});

describe('syncTitleAvailability', () => {
  it('fetches movie providers and replaces the availability set', async () => {
    const { database, insert, delete: del } = mockDatabase();
    const source = mockSource({
      movieWatchProviders: vi
        .fn()
        .mockResolvedValue({ results: { SE: { link: 'x', flatrate: [offer(8)] } } }),
    });

    await expect(
      syncTitleAvailability(database, source, { mediaType: 'movie', tmdbId: 1 }),
    ).resolves.toBe('synced');
    expect(source.movieWatchProviders).toHaveBeenCalledWith(1);
    expect(del).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledTimes(2);
  });

  it('fetches TV providers through the TV endpoint', async () => {
    const { database } = mockDatabase();
    const source = mockSource();

    await syncTitleAvailability(database, source, { mediaType: 'tv', tmdbId: 2 });

    expect(source.tvWatchProviders).toHaveBeenCalledWith(2);
    expect(source.movieWatchProviders).not.toHaveBeenCalled();
  });

  it('records an empty set for a title TMDB no longer has so it is not retried', async () => {
    const { database, insert } = mockDatabase();
    const source = mockSource({
      tvWatchProviders: vi.fn().mockRejectedValue(new TmdbRequestError('nope', 404)),
    });

    await expect(
      syncTitleAvailability(database, source, { mediaType: 'tv', tmdbId: 2 }),
    ).resolves.toBe('gone');
    // Marker only; no offers.
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('propagates other failures without touching the database', async () => {
    const { database, insert } = mockDatabase();
    const source = mockSource({
      movieWatchProviders: vi.fn().mockRejectedValue(new Error('TMDB down')),
    });

    await expect(
      syncTitleAvailability(database, source, { mediaType: 'movie', tmdbId: 1 }),
    ).rejects.toThrow('TMDB down');
    expect(insert).not.toHaveBeenCalled();
  });
});

describe('syncTitle', () => {
  it('syncs details and availability', async () => {
    const { database } = mockDatabase();
    const source = mockSource();

    await syncTitle(database, source, { mediaType: 'movie', tmdbId: 550 });

    expect(source.movieDetails).toHaveBeenCalledWith(550);
    expect(source.movieWatchProviders).toHaveBeenCalledWith(550);
  });
});

describe('working-set queries', () => {
  it('selectTitlesNeedingDetails returns the distinct keys', async () => {
    const { database, selectDistinct } = mockDatabase();
    selectDistinct.mockReturnValue(chain([{ mediaType: 'movie', tmdbId: 1 }]));

    await expect(selectTitlesNeedingDetails(database, {})).resolves.toEqual([
      { mediaType: 'movie', tmdbId: 1 },
    ]);
  });

  it('selectTitlesNeedingAvailability accepts a stale cut-off and a scope', async () => {
    const { database, selectDistinct } = mockDatabase();
    selectDistinct.mockReturnValue(chain([]));

    await expect(
      selectTitlesNeedingAvailability(database, {
        staleBefore: new Date(0),
        scope: sql`1 = 1`,
      }),
    ).resolves.toEqual([]);
    expect(selectDistinct).toHaveBeenCalledTimes(1);
  });

  it('pruneOrphanTitles reports how many rows each delete removed', async () => {
    const { database, delete: del } = mockDatabase();
    del
      .mockReturnValueOnce(chain([{ tmdbId: 1 }, { tmdbId: 2 }]))
      .mockReturnValueOnce(chain([{ tmdbId: 1 }]));

    await expect(pruneOrphanTitles(database)).resolves.toEqual({ titles: 2, availability: 1 });
  });
});

describe('mapWithConcurrency', () => {
  it('preserves result order and caps in-flight work', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const results = await mapWithConcurrency([3, 1, 2, 5, 4], 2, async (n) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, n));
      inFlight--;
      return n * 10;
    });

    expect(results).toEqual([30, 10, 20, 50, 40]);
    expect(maxInFlight).toBe(2);
  });

  it('returns an empty array for no items without invoking the callback', async () => {
    const fn = vi.fn();
    await expect(mapWithConcurrency([], 4, fn)).resolves.toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });

  it('rejects on the first failure and stops picking up further items', async () => {
    const fn = vi.fn(async (n: number) => {
      if (n === 1) {
        throw new Error('boom');
      }
      return n;
    });

    await expect(mapWithConcurrency([1, 2, 3, 4], 1, fn)).rejects.toThrow('boom');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
