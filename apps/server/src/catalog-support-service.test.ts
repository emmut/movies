import { describe, expect, it, vi } from 'vitest';

import { createCatalogSupportService } from './catalog-support-service';

const input = { id: 42, type: 'movie', region: 'SE' } as const;
const provider = {
  provider_id: 8,
  provider_name: 'Test service',
  logo_path: '/logo.png',
  secret: 'discard',
};
describe('catalog supporting service', () => {
  it('uses movie/TV video endpoints and shares trailer selection', async () => {
    for (const type of ['movie', 'tv'] as const) {
      const fetcher = vi
        .fn()
        .mockResolvedValue({ results: [{ key: 'AbCdEfGhI_1', type: 'Trailer', site: 'YouTube' }] });
      expect(await createCatalogSupportService(fetcher).trailer({ id: 42, type })).toEqual({
        key: 'AbCdEfGhI_1',
      });
      expect(fetcher).toHaveBeenCalledWith(`/${type}/42/videos`);
    }
  });
  it('returns null for absent trailer data and surfaces outages', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ results: [] })
      .mockRejectedValueOnce(new Error('outage'));
    const service = createCatalogSupportService(fetcher);
    expect(await service.trailer(input)).toBeNull();
    await expect(service.trailer(input)).rejects.toThrow('outage');
  });
  it('normalizes all four provider groups for exactly the requested region', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      results: {
        SE: {
          link: 'https://www.themoviedb.org/movie/42/watch?locale=SE',
          free: [provider],
          flatrate: [provider],
          rent: [provider],
          buy: [provider],
        },
        US: { flatrate: [{ ...provider, provider_name: 'Different service' }] },
      },
    });
    const groups = await createCatalogSupportService(fetcher).providers(input);
    const expected = [
      { id: 8, name: 'Test service', logoUrl: 'https://image.tmdb.org/t/p/w92/logo.png' },
    ];
    expect(groups).toEqual({
      link: 'https://www.themoviedb.org/movie/42/watch?locale=SE',
      free: expected,
      streaming: expected,
      rent: expected,
      buy: expected,
    });
    expect(fetcher).toHaveBeenCalledWith('/movie/42/watch/providers');
  });
  it('handles free-only regions and missing logos', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({ results: { SE: { free: [{ ...provider, logo_path: null }] } } });
    expect(await createCatalogSupportService(fetcher).providers(input)).toMatchObject({
      free: [{ id: 8, name: 'Test service', logoUrl: null }],
      streaming: [],
      rent: [],
      buy: [],
    });
  });
  it('handles missing regions without fabricating availability', async () => {
    const fetcher = vi.fn().mockResolvedValue({ results: {} });
    expect(await createCatalogSupportService(fetcher).providers({ ...input, type: 'tv' })).toEqual({
      link: 'https://www.themoviedb.org/tv/42/watch',
      free: [],
      streaming: [],
      rent: [],
      buy: [],
    });
  });
  it.each(['javascript:alert(1)', 'invalid', '', undefined])(
    'falls back for missing/unsafe provider URL %s',
    async (link) => {
      const fetcher = vi.fn().mockResolvedValue({ results: { SE: { link } } });
      expect((await createCatalogSupportService(fetcher).providers(input)).link).toBe(
        'https://www.themoviedb.org/movie/42/watch',
      );
    },
  );
  it('accepts an ordinary HTTP provider link', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({ results: { SE: { link: 'http://example.com/watch' } } });
    expect((await createCatalogSupportService(fetcher).providers(input)).link).toBe(
      'http://example.com/watch',
    );
  });
  it.each(['similar', 'recommendations'] as const)(
    'loads %s with movie/TV type and region-aware transport',
    async (kind) => {
      const fetcher = vi.fn().mockResolvedValue({
        results: [{ id: 7, name: 'Another show', first_air_date: '2025', vote_average: 8.2 }],
      });
      expect(
        await createCatalogSupportService(fetcher).related({
          ...input,
          type: 'tv',
          kind,
          region: 'US',
        }),
      ).toEqual([
        {
          id: 7,
          type: 'tv',
          title: 'Another show',
          releaseDate: '2025',
          rating: 8.2,
          posterUrl: null,
          backdropUrl: null,
        },
      ]);
      expect(fetcher).toHaveBeenCalledWith(`/tv/42/${kind}`, { searchParams: { region: 'US' } });
    },
  );
  it('preserves related title order, artwork, missing-date fallbacks and empty results', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        results: [
          { id: 2, title: 'Movie', poster_path: '/poster', backdrop_path: '/backdrop' },
          { id: 1 },
        ],
      })
      .mockResolvedValueOnce({ results: [] });
    const service = createCatalogSupportService(fetcher);
    expect(await service.related({ ...input, kind: 'similar' })).toEqual([
      {
        id: 2,
        type: 'movie',
        title: 'Movie',
        releaseDate: '',
        rating: 0,
        posterUrl: 'https://image.tmdb.org/t/p/w342/poster',
        backdropUrl: 'https://image.tmdb.org/t/p/w780/backdrop',
      },
      {
        id: 1,
        type: 'movie',
        title: '',
        releaseDate: '',
        rating: 0,
        posterUrl: null,
        backdropUrl: null,
      },
    ]);
    expect(await service.related({ ...input, kind: 'similar' })).toEqual([]);
  });
  it('rejects malformed supporting payloads instead of returning false empty states', async () => {
    const fetcher = vi.fn().mockResolvedValue({ results: 'invalid' });
    const service = createCatalogSupportService(fetcher);
    await expect(service.trailer(input)).rejects.toThrow();
    await expect(service.providers(input)).rejects.toThrow();
    await expect(service.related({ ...input, kind: 'similar' })).rejects.toThrow();
  });
});
