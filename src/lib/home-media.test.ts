import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getHomeMediaList, HomeMediaCategory } from './home-media';
import { DEFAULT_REGION } from './regions';

vi.mock('./movies', () => ({
  fetchNowPlayingMovies: vi.fn(async (region: string) => [{ id: 1, region, src: 'now-playing' }]),
  fetchUpcomingMovies: vi.fn(async (region: string) => [{ id: 2, region, src: 'upcoming' }]),
  fetchTopRatedMovies: vi.fn(async (region: string) => [{ id: 3, region, src: 'top-rated-movie' }]),
}));

vi.mock('./tv-shows', () => ({
  fetchOnTheAirTvShows: vi.fn(async (region: string) => [{ id: 4, region, src: 'on-the-air' }]),
  fetchPopularTvShows: vi.fn(async (region: string) => [{ id: 5, region, src: 'popular-tv' }]),
  fetchTopRatedTvShows: vi.fn(async (region: string) => [{ id: 6, region, src: 'top-rated-tv' }]),
}));

const CATEGORY_SOURCE: Record<HomeMediaCategory, string> = {
  'now-playing-movies': 'now-playing',
  'upcoming-movies': 'upcoming',
  'top-rated-movies': 'top-rated-movie',
  'on-the-air-tv': 'on-the-air',
  'popular-tv': 'popular-tv',
  'top-rated-tv': 'top-rated-tv',
};

describe('getHomeMediaList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches every category to its matching fetcher and forwards the region', async () => {
    for (const [category, source] of Object.entries(CATEGORY_SOURCE)) {
      const items = await getHomeMediaList(category as HomeMediaCategory, 'US');
      expect(items).toEqual([expect.objectContaining({ region: 'US', src: source })]);
    }
  });

  it('falls back to the default region when none is provided', async () => {
    const items = await getHomeMediaList('now-playing-movies');
    expect(items).toEqual([expect.objectContaining({ region: DEFAULT_REGION })]);
  });
});
