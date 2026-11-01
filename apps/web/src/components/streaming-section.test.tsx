import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/movies', () => ({ getMovieWatchProviders: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ getTvShowWatchProviders: vi.fn() }));
vi.mock('@/lib/watchmode', () => ({ getDirectWatchOffers: vi.fn() }));
vi.mock('@/lib/tmdb', () => ({
  optional: async (promise: Promise<unknown>, fallback: unknown) => promise.catch(() => fallback),
}));

import { getMovieWatchProviders } from '@/lib/movies';
import { getTvShowWatchProviders } from '@/lib/tv-shows';
import { getDirectWatchOffers } from '@/lib/watchmode';

import { StreamingSection } from './streaming-section';

const providers = { results: {} };
const offers = [
  {
    providerName: 'Netflix',
    region: 'US',
    type: 'flatrate' as const,
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
      vi.mocked(getDirectWatchOffers).mockResolvedValue(offers);
      const section = await StreamingSection({ resourceType, resourceId: 123, userRegion: 'US' });
      expect(getProviders).toHaveBeenCalledWith(123);
      expect(getDirectWatchOffers).toHaveBeenCalledWith(resourceType, 123);
      expect(section.props.watchProviders).toEqual(providers);
      expect(section.props.directOffers).toEqual(offers);
    },
  );

  it('preserves the availability fallback if TMDB fails', async () => {
    vi.mocked(getMovieWatchProviders).mockRejectedValue(new Error('unavailable'));
    vi.mocked(getDirectWatchOffers).mockResolvedValue([]);
    const section = await StreamingSection({
      resourceType: 'movie',
      resourceId: 1,
      userRegion: 'SE',
    });
    expect(section.props.watchProviders).toEqual({ results: {} });
    expect(section.props.directOffers).toEqual([]);
  });
});
