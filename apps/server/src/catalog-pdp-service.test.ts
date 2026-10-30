import { createApp } from '@server/app';
import { createCatalogPdpService } from '@server/catalog-pdp-service';
import { createCatalogService } from '@server/catalog-service';
import { createTestClient, mockServices } from '@server/test-services';
import { describe, expect, it, vi } from 'vite-plus/test';
const input = { id: 42, type: 'movie' as const, region: 'SE' };

describe('additional title information', () => {
  it('shares image limits, video ordering, keywords and exact regional release rules with web', async () => {
    const videos = [
      { id: '1', key: 'valid_key_1', name: 'Clip', type: 'Clip', official: true, site: 'YouTube' },
      {
        id: '2',
        key: 'valid_key_2',
        name: 'Trailer',
        type: 'Trailer',
        official: true,
        site: 'YouTube',
      },
    ];
    const fetcher = vi.fn().mockResolvedValue({
      id: 42,
      images: {
        backdrops: Array.from({ length: 10 }, (_, i) => ({ file_path: '/' + i })),
        posters: [{ file_path: '/poster' }],
      },
      videos: { results: videos },
      keywords: { keywords: [{ id: 9, name: 'dystopia' }] },
      release_dates: {
        results: [
          { iso_3166_1: 'US', release_dates: [{ type: 3, release_date: '1999-01-01' }] },
          { iso_3166_1: 'SE', release_dates: [{ type: 4, release_date: '1999-03-01T00:00:00Z' }] },
        ],
      },
    });
    const result = await createCatalogPdpService(fetcher).extras(input);
    expect(result.images).toHaveLength(9);
    expect(result.videos.map((video) => video.name)).toEqual(['Trailer', 'Clip']);
    expect(result.keywords).toEqual([{ id: 9, name: 'dystopia' }]);
    expect(result.releases).toEqual([
      { key: '4:1999-03-01', label: 'Digital', date: '1999-03-01' },
    ]);
    expect(fetcher).toHaveBeenCalledWith(
      '/movie/42',
      expect.objectContaining({
        searchParams: {
          append_to_response: 'images,keywords,videos,release_dates',
          include_image_language: 'en,null',
        },
      }),
    );
  });
  it('preserves specials, unknown air dates and unreleased episode metadata', async () => {
    const episode = {
      id: 3,
      name: 'Secret',
      episode_number: 1,
      season_number: 0,
      overview: 'Spoiler',
    };
    const fetcher = vi.fn().mockResolvedValue({
      id: 42,
      seasons: [{ id: 2, name: 'Specials', season_number: 0, episode_count: 1 }],
      next_episode_to_air: episode,
    });
    const result = await createCatalogPdpService(fetcher).extras({ ...input, type: 'tv' });
    expect(result.seasons[0].season_number).toBe(0);
    expect(result.next).toMatchObject({ name: 'Secret', air_date: null, still_path: null });
    expect(result.releases).toEqual([]);
  });
  it('rejects mismatched or malformed upstream metadata rather than inventing empty success', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ id: 43 })
      .mockResolvedValueOnce({ id: 42, seasons: 'broken' })
      .mockRejectedValueOnce(new Error('offline'));
    const service = createCatalogPdpService(fetcher);
    await expect(service.extras(input)).rejects.toThrow('identifier mismatch');
    await expect(service.extras(input)).rejects.toThrow();
    await expect(service.extras(input)).rejects.toThrow('offline');
  });
  it('loads the requested season zero and collection with validated outputs', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ name: 'Specials', episodes: [] })
      .mockResolvedValueOnce({
        name: 'Collection',
        parts: [{ id: 4, title: 'Part', poster_path: null, release_date: '' }],
      });
    const service = createCatalogPdpService(fetcher);
    expect(await service.season({ id: 42, season: 0 })).toEqual({ name: 'Specials', episodes: [] });
    expect((await service.collection({ id: 5 })).parts[0].id).toBe(4);
    expect(fetcher.mock.calls.map((call) => call[0])).toEqual(['/tv/42/season/0', '/collection/5']);
  });
  it('forwards keyword type, page and region and caps upstream navigation at 500', async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(async (path) =>
        path.startsWith('/keyword/') ? { name: 'Space' } : { results: [], total_pages: 900 },
      );
    const result = await createCatalogPdpService(fetcher).keyword({
      ...input,
      type: 'tv',
      page: 2,
    });
    expect(result).toEqual({ name: 'Space', items: [], page: 2, totalPages: 500 });
    expect(fetcher).toHaveBeenCalledWith('/discover/tv', {
      searchParams: {
        with_keywords: 42,
        page: 2,
        region: 'SE',
        include_adult: 'false',
        sort_by: 'popularity.desc',
      },
    });
  });
  it('validates public RPC inputs before executing upstream calls', async () => {
    const fetcher = vi.fn();
    const client = createTestClient(
      createApp(mockServices({ catalog: createCatalogService(fetcher) })),
    );
    await expect(client.catalog.season({ id: 42, season: -1 })).rejects.toThrow();
    await expect(client.catalog.keyword({ ...input, page: 501 })).rejects.toThrow();
    await expect(client.catalog.collection({ id: 0 })).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
