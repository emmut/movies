import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/movies', () => ({ getMovieWatchProviders: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ getTvShowWatchProviders: vi.fn() }));

import { getMovieWatchProviders } from '@/lib/movies';
import { getTvShowWatchProviders } from '@/lib/tv-shows';
import type { WatchProvider } from '@/types/watch-provider';

import {
  filterRowsByWatchProviders,
  matchesWatchProviders,
  parseWatchProviderFilter,
} from './watch-provider-availability';

function offer(id: number): WatchProvider {
  return { provider_id: id, provider_name: `Provider ${id}`, logo_path: '/logo.png', display_priority: 1 };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('parseWatchProviderFilter', () => {
  it('returns null when no providers are requested', () => {
    expect(parseWatchProviderFilter(undefined, 'SE')).toBeNull();
    expect(parseWatchProviderFilter([], 'SE')).toBeNull();
  });

  it('validates providers and keeps the given region', () => {
    expect(parseWatchProviderFilter([8, 337], 'US')).toEqual({
      providerIds: [8, 337],
      region: 'US',
    });
  });

  it('falls back to the default region when none is given', () => {
    expect(parseWatchProviderFilter([8])).toEqual({ providerIds: [8], region: 'SE' });
  });

  it('rejects unknown regions', () => {
    expect(() => parseWatchProviderFilter([8], 'XX')).toThrow();
  });

  it('rejects malformed provider ids', () => {
    expect(() => parseWatchProviderFilter([0], 'SE')).toThrow();
    expect(() => parseWatchProviderFilter([1.5], 'SE')).toThrow();
  });
});

describe('matchesWatchProviders', () => {
  const filter = { providerIds: [8, 337], region: 'SE' };

  it('matches a movie streamable via flatrate on a selected provider', async () => {
    vi.mocked(getMovieWatchProviders).mockResolvedValue({
      results: { SE: { link: 'https://tmdb', flatrate: [offer(8)] } },
    });

    await expect(
      matchesWatchProviders({ resourceType: 'movie', resourceId: 1 }, filter),
    ).resolves.toBe(true);
    expect(getMovieWatchProviders).toHaveBeenCalledWith(1);
  });

  it('matches a title available for free on a selected provider', async () => {
    vi.mocked(getMovieWatchProviders).mockResolvedValue({
      results: { SE: { link: 'https://tmdb', free: [offer(337)] } },
    });

    await expect(
      matchesWatchProviders({ resourceType: 'movie', resourceId: 1 }, filter),
    ).resolves.toBe(true);
  });

  it('does not match rent- or buy-only availability', async () => {
    vi.mocked(getMovieWatchProviders).mockResolvedValue({
      results: { SE: { link: 'https://tmdb', rent: [offer(8)], buy: [offer(337)] } },
    });

    await expect(
      matchesWatchProviders({ resourceType: 'movie', resourceId: 1 }, filter),
    ).resolves.toBe(false);
  });

  it('does not match availability in other regions only', async () => {
    vi.mocked(getMovieWatchProviders).mockResolvedValue({
      results: { US: { link: 'https://tmdb', flatrate: [offer(8)] } },
    });

    await expect(
      matchesWatchProviders({ resourceType: 'movie', resourceId: 1 }, filter),
    ).resolves.toBe(false);
  });

  it('does not match providers outside the selected set', async () => {
    vi.mocked(getMovieWatchProviders).mockResolvedValue({
      results: { SE: { link: 'https://tmdb', flatrate: [offer(9)] } },
    });

    await expect(
      matchesWatchProviders({ resourceType: 'movie', resourceId: 1 }, filter),
    ).resolves.toBe(false);
  });

  it('checks TV shows through the TV provider endpoint', async () => {
    vi.mocked(getTvShowWatchProviders).mockResolvedValue({
      results: { SE: { link: 'https://tmdb', flatrate: [offer(337)] } },
    });

    await expect(matchesWatchProviders({ resourceType: 'tv', resourceId: 42 }, filter)).resolves.toBe(
      true,
    );
    expect(getTvShowWatchProviders).toHaveBeenCalledWith(42);
    expect(getMovieWatchProviders).not.toHaveBeenCalled();
  });

  it('never matches person rows and skips the lookup', async () => {
    await expect(
      matchesWatchProviders({ resourceType: 'person', resourceId: 7 }, filter),
    ).resolves.toBe(false);
    expect(getMovieWatchProviders).not.toHaveBeenCalled();
    expect(getTvShowWatchProviders).not.toHaveBeenCalled();
  });

  it('propagates a failed provider lookup instead of reporting unavailable', async () => {
    vi.mocked(getMovieWatchProviders).mockRejectedValue(new Error('TMDB down'));

    await expect(
      matchesWatchProviders({ resourceType: 'movie', resourceId: 1 }, filter),
    ).rejects.toThrow('TMDB down');
  });
});

describe('filterRowsByWatchProviders', () => {
  it('keeps only streamable rows, preserving order', async () => {
    vi.mocked(getMovieWatchProviders).mockImplementation(async (movieId: number) => ({
      results:
        movieId % 2 === 1 ? { SE: { link: 'https://tmdb', flatrate: [offer(8)] } } : {},
    }));

    const rows = [
      { resourceId: 1, resourceType: 'movie' },
      { resourceId: 2, resourceType: 'movie' },
      { resourceId: 3, resourceType: 'movie' },
      { resourceId: 4, resourceType: 'person' },
    ];

    const result = await filterRowsByWatchProviders(rows, { providerIds: [8], region: 'SE' });

    expect(result).toEqual([
      { resourceId: 1, resourceType: 'movie' },
      { resourceId: 3, resourceType: 'movie' },
    ]);
  });

  it('bounds concurrent lookups while still filtering every row', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    vi.mocked(getMovieWatchProviders).mockImplementation(async (movieId: number) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight--;
      return {
        results: movieId % 2 === 1 ? { SE: { link: 'https://tmdb', flatrate: [offer(8)] } } : {},
      };
    });

    const rows = Array.from({ length: 25 }, (_, i) => ({
      resourceId: i + 1,
      resourceType: 'movie',
    }));

    const result = await filterRowsByWatchProviders(rows, { providerIds: [8], region: 'SE' });

    expect(result).toHaveLength(13);
    expect(maxInFlight).toBeLessThanOrEqual(10);
  });
});
