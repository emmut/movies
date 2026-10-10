import { discoveryInput } from '@movies/api/discover';
import { createDiscoveryService } from '@server/discovery-service';
import { describe, expect, it, vi } from 'vitest';

const record = {
  id: 42,
  title: 'A movie',
  release_date: '2026-01-01',
  poster_path: '/poster.jpg',
  backdrop_path: null,
  vote_average: 8.2,
};
describe('discovery service', () => {
  it('uses the canonical provider/region defaults and caps TMDB pages', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({ results: [record], total_pages: 900, total_results: 10000 });
    const result = await createDiscoveryService(fetcher).list(discoveryInput.parse({}));
    expect(fetcher).toHaveBeenCalledWith('/discover/movie', {
      searchParams: {
        page: 1,
        sort_by: 'popularity.desc',
        region: 'SE',
        include_adult: 'false',
        with_watch_providers: expect.any(String),
        watch_region: 'SE',
      },
    });
    expect(result.totalPages).toBe(500);
    expect(result.items[0]).toMatchObject({
      id: 42,
      type: 'movie',
      title: 'A movie',
      posterUrl: 'https://image.tmdb.org/t/p/w342/poster.jpg',
    });
  });
  it('preserves all explicit TV filters and OR semantics', async () => {
    const fetcher = vi.fn().mockResolvedValue({ results: [], total_pages: 0, total_results: 0 });
    await createDiscoveryService(fetcher).list(
      discoveryInput.parse({
        type: 'tv',
        page: 2,
        region: 'US',
        genreIds: [1, 2],
        providerIds: [8, 9],
        originCountries: ['SE', 'US'],
        sortBy: 'first_air_date.asc',
        runtime: 90,
      }),
    );
    expect(fetcher).toHaveBeenCalledWith('/discover/tv', {
      searchParams: {
        page: 2,
        region: 'US',
        sort_by: 'first_air_date.asc',
        include_adult: 'false',
        with_genres: '1|2',
        with_watch_providers: '8|9',
        watch_region: 'US',
        with_origin_country: 'SE|US',
        'with_runtime.lte': 90,
        'with_runtime.gte': 1,
      },
    });
  });
  it('does not apply implicit providers when an origin country is selected', async () => {
    const fetcher = vi.fn().mockResolvedValue({ results: [], total_pages: 0, total_results: 0 });
    await createDiscoveryService(fetcher).list(discoveryInput.parse({ originCountries: ['IR'] }));
    expect(fetcher.mock.calls[0][1].searchParams).not.toHaveProperty('with_watch_providers');
  });
  it('loads regional choices concurrently and normalizes ordered output', async () => {
    const fetcher = vi.fn().mockImplementation(async (path: string) => {
      if (path.startsWith('/genre')) return { genres: [{ id: 12, name: 'Adventure' }] };
      if (path.startsWith('/watch'))
        return {
          results: [
            { provider_id: 9, provider_name: 'Second', logo_path: null, display_priority: 2 },
            { provider_id: 8, provider_name: 'First', logo_path: '/logo.png' },
          ],
        };
      return [
        { iso_3166_1: 'US', english_name: 'United States' },
        { iso_3166_1: 'SE', english_name: 'Sweden' },
      ];
    });
    const result = await createDiscoveryService(fetcher).options({ type: 'tv', region: 'US' });
    expect(fetcher).toHaveBeenCalledWith('/watch/providers/tv', {
      searchParams: { watch_region: 'US' },
    });
    expect(result.genres).toEqual([{ id: 12, name: 'Adventure' }]);
    expect(result.providers.map((item) => item.id)).toEqual([8, 9]);
    expect(result.providers[0].logoUrl).toBe('https://image.tmdb.org/t/p/w92/logo.png');
    expect(result.providers[1].logoUrl).toBeNull();
    expect(result.countries.map((item) => item.code)).toEqual(['SE', 'US']);
  });
  it('rejects malformed upstream records instead of emitting invalid navigation IDs', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({ results: [{ ...record, id: -1 }], total_pages: 1, total_results: 1 });
    await expect(createDiscoveryService(fetcher).list(discoveryInput.parse({}))).rejects.toThrow();
  });
  it('propagates upstream failures for a retryable UI', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(createDiscoveryService(fetcher).list(discoveryInput.parse({}))).rejects.toThrow(
      'offline',
    );
    await expect(
      createDiscoveryService(fetcher).options({ type: 'movie', region: 'SE' }),
    ).rejects.toThrow('offline');
  });
});
