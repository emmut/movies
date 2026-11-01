import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/movies', () => ({ getMovieWatchProviders: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ getTvShowWatchProviders: vi.fn() }));
vi.mock('@/lib/wikidata', () => ({ getWikidataWatchLinks: vi.fn() }));
vi.mock('@/lib/tmdb', () => ({
  optional: async (promise: Promise<unknown>, fallback: unknown) => promise.catch(() => fallback),
}));

import { getMovieWatchProviders } from '@/lib/movies';
import { getTvShowWatchProviders } from '@/lib/tv-shows';
import { getWikidataWatchLinks } from '@/lib/wikidata';

import { StreamingSection } from './streaming-section';

const providers = { results: {} };
const offers = [
  {
    providerId: 8,
    types: ['flatrate' as const],
    url: 'https://www.netflix.com/title/1',
  },
];

describe('streaming section', () => {
  it.each(['movie', 'tv'] as const)(
    'loads %s availability and direct links for the same title',
    async (resourceType) => {
      const getProviders =
        resourceType === 'movie' ? getMovieWatchProviders : getTvShowWatchProviders;
      vi.mocked(getProviders).mockResolvedValue(providers);
      vi.mocked(getWikidataWatchLinks).mockResolvedValue(offers);
      const section = await StreamingSection({ resourceType, resourceId: 123, userRegion: 'US' });
      expect(getProviders).toHaveBeenCalledWith(123);
      expect(getWikidataWatchLinks).toHaveBeenCalledWith(resourceType, 123);
      expect(section.props.watchProviders).toEqual(providers);
      expect(section.props.directLinks).toEqual(offers);
    },
  );

  it('preserves the availability fallback if TMDB fails', async () => {
    vi.mocked(getMovieWatchProviders).mockRejectedValue(new Error('unavailable'));
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([]);
    const section = await StreamingSection({
      resourceType: 'movie',
      resourceId: 1,
      userRegion: 'SE',
    });
    expect(section.props.watchProviders).toEqual({ results: {} });
    expect(section.props.directLinks).toEqual([]);
  });
});
