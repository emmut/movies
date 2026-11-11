import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/components/image-proxy', () => ({ Imgproxy: () => null }));
vi.mock('@/lib/movies', () => ({ fetchTrendingMovies: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ fetchTrendingTvShows: vi.fn() }));

import { fetchTrendingMovies } from '@/lib/movies';
import { fetchTrendingTvShows } from '@/lib/tv-shows';
import type { Movie } from '@/types/movie';
import type { TvShow } from '@/types/tv-show';

import Trending from './trending';

beforeEach(() => vi.clearAllMocks());

describe('Trending', () => {
  it.each([-1, 0, 1])('omits unavailable featured titles at index %i', async (index) => {
    vi.mocked(fetchTrendingMovies).mockResolvedValue([]);
    expect(await Trending({ index, type: 'movie' })).toBeNull();
  });

  it('links to the movie with a visible title, year, and exploration cue', async () => {
    vi.mocked(fetchTrendingMovies).mockResolvedValue([
      { id: 42, title: 'A featured movie', release_date: '2026-01-01' } as Movie,
    ]);
    const html = renderToStaticMarkup(await Trending({ index: 0, type: 'movie' }));
    expect(html).toContain('href="/movie/42"');
    expect(html).toContain('aria-label="Explore A featured movie"');
    expect(html).toContain('2026');
    expect(html).toContain('Explore title');
    expect(html).not.toContain('opacity-0');
  });

  it('supports TV titles without a release date', async () => {
    vi.mocked(fetchTrendingTvShows).mockResolvedValue([
      { id: 7, name: 'A series', first_air_date: '' } as TvShow,
    ]);
    const html = renderToStaticMarkup(await Trending({ index: 0, type: 'tv' }));
    expect(html).toContain('href="/tv/7"');
    expect(html).toContain('A series');
    expect(html).not.toContain('Invalid Date');
  });
});
