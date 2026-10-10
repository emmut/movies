import { HOME_SECTIONS } from '@movies/api/home';
import { describe, expect, it, vi } from 'vitest';

import { createHomeService } from './home-service';

const movie = {
  id: 1,
  title: 'A movie',
  release_date: '2026-10-10',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  vote_average: 8.3,
};
describe('home service', () => {
  it.each(HOME_SECTIONS.filter((item) => item.category !== 'upcoming-movies'))(
    'loads $category with its region and media type',
    async (section) => {
      const fetcher = vi.fn().mockResolvedValue({ results: [movie] });
      const result = await createHomeService(fetcher).list({
        category: section.category,
        region: 'US',
      });
      expect(fetcher).toHaveBeenCalledWith(
        expect.stringContaining(section.type === 'movie' ? '/movie/' : '/tv/'),
        { searchParams: { region: 'US' } },
      );
      expect(result[0]).toEqual({
        id: 1,
        type: section.type,
        title: 'A movie',
        releaseDate: '2026-10-10',
        rating: 8.3,
        posterUrl: 'https://image.tmdb.org/t/p/w342/poster.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/w780/backdrop.jpg',
      });
    },
  );
  it('excludes movies already playing from upcoming releases', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ results: [movie, { ...movie, id: 2 }] })
      .mockResolvedValueOnce({ results: [movie] });
    expect(
      await createHomeService(fetcher).list({ category: 'upcoming-movies', region: 'SE' }),
    ).toEqual([expect.objectContaining({ id: 2 })]);
    expect(fetcher.mock.calls.map((call) => call[0])).toEqual([
      '/movie/upcoming',
      '/movie/now_playing',
    ]);
  });
  it.each(['movie', 'tv'] as const)('loads daily trending %s', async (type) => {
    const fetcher = vi.fn().mockResolvedValue({
      results: [
        {
          id: 2,
          name: 'A series',
          first_air_date: '2025',
          poster_path: null,
          backdrop_path: null,
          vote_average: 0,
        },
      ],
    });
    expect(await createHomeService(fetcher).trending({ type })).toEqual([
      {
        id: 2,
        type,
        title: 'A series',
        releaseDate: '2025',
        posterUrl: null,
        backdropUrl: null,
        rating: 0,
      },
    ]);
    expect(fetcher).toHaveBeenCalledWith(`/trending/${type}/day`, {
      searchParams: { region: undefined },
    });
  });
  it('supports missing dates, names and empty lists', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        results: [{ id: 3, poster_path: null, backdrop_path: null, vote_average: 0 }],
      })
      .mockResolvedValueOnce({ results: [] });
    const service = createHomeService(fetcher);
    expect((await service.trending({ type: 'movie' }))[0]).toMatchObject({
      title: '',
      releaseDate: '',
    });
    expect(await service.trending({ type: 'tv' })).toEqual([]);
  });
  it('surfaces upstream errors for per-row retry', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Upstream unavailable'));
    await expect(
      createHomeService(fetcher).list({ category: 'popular-tv', region: 'SE' }),
    ).rejects.toThrow('Upstream unavailable');
  });
});
