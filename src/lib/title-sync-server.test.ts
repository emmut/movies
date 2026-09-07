import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({ after: vi.fn((fn: () => Promise<void>) => fn()) }));
vi.mock('@/lib/db', () => ({ db: { tag: 'db' } }));
vi.mock('@/lib/movies', () => ({ getMovieDetails: vi.fn(), getMovieWatchProviders: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({
  getTvShowDetails: vi.fn(),
  getTvShowWatchProviders: vi.fn(),
}));
vi.mock('@/lib/title-sync', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/title-sync')>();
  return { ...actual, syncTitle: vi.fn() };
});

import { after } from 'next/server';

import { db } from '@/lib/db';
import { getMovieDetails, getMovieWatchProviders } from '@/lib/movies';
import { syncTitle } from '@/lib/title-sync';
import { getTvShowDetails, getTvShowWatchProviders } from '@/lib/tv-shows';

import { appTitleSource, scheduleTitleSync } from './title-sync-server';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(syncTitle).mockResolvedValue(undefined);
});

describe('appTitleSource', () => {
  it('reads through the app’s cached TMDB fetchers', () => {
    expect(appTitleSource.movieDetails).toBe(getMovieDetails);
    expect(appTitleSource.tvDetails).toBe(getTvShowDetails);
    expect(appTitleSource.movieWatchProviders).toBe(getMovieWatchProviders);
    expect(appTitleSource.tvWatchProviders).toBe(getTvShowWatchProviders);
  });
});

describe('scheduleTitleSync', () => {
  it('syncs a movie after the response through after()', async () => {
    scheduleTitleSync('movie', 550);
    await vi.mocked(after).mock.results[0].value;

    expect(after).toHaveBeenCalledTimes(1);
    expect(syncTitle).toHaveBeenCalledWith(db, appTitleSource, { mediaType: 'movie', tmdbId: 550 });
  });

  it('ignores person rows', () => {
    scheduleTitleSync('person', 1);

    expect(after).not.toHaveBeenCalled();
    expect(syncTitle).not.toHaveBeenCalled();
  });

  it('logs a failed sync instead of throwing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(syncTitle).mockRejectedValue(new Error('TMDB down'));

    scheduleTitleSync('tv', 2);
    await expect(vi.mocked(after).mock.results[0].value).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      'Title sync failed for tv 2:',
      expect.objectContaining({ message: 'TMDB down' }),
    );
    consoleError.mockRestore();
  });
});
