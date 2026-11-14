import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createSearchHydrator } from './search-hydration';
const getMovieDetails = vi.fn();
const getTvShowDetails = vi.fn();
const getPersonDetails = vi.fn();
const { hydrateSearchIndexHits } = createSearchHydrator({
  movie: getMovieDetails,
  tv: getTvShowDetails,
  person: getPersonDetails,
});
beforeEach(() => vi.clearAllMocks());
describe('hydrateSearchIndexHits', () => {
  const hits = [
    { tmdbId: 1, mediaType: 'movie' as const, title: 'A', popularity: 1, similarity: 1, score: 1 },
    { tmdbId: 2, mediaType: 'tv' as const, title: 'B', popularity: 1, similarity: 1, score: 0.9 },
    {
      tmdbId: 3,
      mediaType: 'person' as const,
      title: 'C',
      popularity: 1,
      similarity: 1,
      score: 0.8,
    },
  ];

  beforeEach(() => {
    vi.mocked(getMovieDetails).mockResolvedValue({
      id: 1,
      title: 'A',
      poster_path: '/a.jpg',
      release_date: '2020-01-01',
      genres: [{ id: 18, name: 'Drama' }],
      vote_average: 7,
      popularity: 1,
    } as never);
    vi.mocked(getTvShowDetails).mockResolvedValue({
      id: 2,
      name: 'B',
      poster_path: '/b.jpg',
      first_air_date: '2019-01-01',
      genres: [],
      origin_country: ['US'],
    } as never);
    vi.mocked(getPersonDetails).mockResolvedValue({
      id: 3,
      name: 'C',
      profile_path: null,
      known_for_department: 'Acting',
    } as never);
  });

  it('hydrates each hit into the multi-search shape, preserving rank', async () => {
    const results = await hydrateSearchIndexHits(hits);

    expect(results.map((result) => [result.media_type, result.id])).toEqual([
      ['movie', 1],
      ['tv', 2],
      ['person', 3],
    ]);
    expect(results[0]).toMatchObject({
      media_type: 'movie',
      title: 'A',
      release_date: '2020-01-01',
      genre_ids: [18],
    });
    expect(results[1]).toMatchObject({ media_type: 'tv', name: 'B', genre_ids: [] });
    expect(results[2]).toMatchObject({
      media_type: 'person',
      name: 'C',
      known_for_department: 'Acting',
      known_for: [],
    });
  });

  it('drops hits whose details fetch fails instead of failing the search', async () => {
    vi.mocked(getTvShowDetails).mockRejectedValue(new Error('gone'));

    const results = await hydrateSearchIndexHits(hits);

    expect(results.map((result) => result.id)).toEqual([1, 3]);
  });

  it('returns nothing without hydrating when the index has no hits', async () => {
    await expect(hydrateSearchIndexHits([])).resolves.toEqual([]);
    expect(getMovieDetails).not.toHaveBeenCalled();
  });
});
