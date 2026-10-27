import { searchInput } from '@movies/api/search';
import { createSearchService } from '@server/search-service';
import { describe, expect, it, vi } from 'vite-plus/test';

const movie = {
  id: 42,
  media_type: 'movie',
  title: 'Alien',
  popularity: 10,
  release_date: '1979-01-01',
  vote_average: 8.2,
};
const series = {
  id: 12,
  media_type: 'tv',
  name: 'The Office',
  popularity: 5,
  first_air_date: '2005-01-01',
};
const person = {
  id: 7,
  media_type: 'person',
  name: 'Sigourney Weaver',
  known_for_department: 'Acting',
  known_for: [{ id: 42, media_type: 'movie', title: 'Alien' }],
  profile_path: '/photo.jpg',
};
function page(results: unknown[], totalPages = 2) {
  return { results, total_pages: totalPages, total_results: results.length };
}
describe('native search service', () => {
  it('uses the canonical title tier before popularity and emits native card contracts', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        page([{ ...movie, id: 43, title: 'Alien: Romulus', popularity: 100 }, movie]),
      );
    const result = await createSearchService(fetcher).list(searchInput.parse({ query: 'alien' }));
    expect(result.items.map((item) => item.id)).toEqual([42, 43]);
    expect(result.items[0]).toMatchObject({
      type: 'movie',
      title: 'Alien',
      rating: 8.2,
      posterUrl: null,
    });
    expect(fetcher).toHaveBeenCalledWith('/search/multi', {
      searchParams: { query: 'alien', page: '1', include_adult: 'false' },
    });
  });
  it('preserves movie year parsing and positive pagination bounds', async () => {
    const fetcher = vi.fn().mockResolvedValue(page([movie], 900));
    const result = await createSearchService(fetcher).list(
      searchInput.parse({ query: 'heat 1995 movie', type: 'movie' }),
    );
    expect(fetcher).toHaveBeenCalledWith('/search/movie', {
      searchParams: {
        query: 'heat',
        page: '1',
        include_adult: 'false',
        include_video: 'false',
        primary_release_year: 1995,
      },
    });
    expect(result.totalPages).toBe(500);
  });
  it('retries the raw query when token parsing produces no results', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(page([]))
      .mockResolvedValueOnce(page([movie]));
    await createSearchService(fetcher).list(
      searchInput.parse({ query: 'heat 1995', type: 'movie' }),
    );
    expect(fetcher.mock.calls[1][1].searchParams.query).toBe('heat 1995');
    expect(fetcher.mock.calls[1][1].searchParams.primary_release_year).toBeUndefined();
  });
  it('uses the TV endpoint and does not consult the index after page one', async () => {
    const fetcher = vi.fn().mockResolvedValue(page([series]));
    const fuzzy = vi.fn().mockResolvedValue([]);
    const result = await createSearchService(fetcher, fuzzy).list(
      searchInput.parse({ query: 'office', type: 'tv', page: 2 }),
    );
    expect(result.items[0]).toMatchObject({ type: 'tv', title: 'The Office' });
    expect(fetcher).toHaveBeenCalledWith('/search/tv', {
      searchParams: {
        query: 'office',
        page: '2',
        include_adult: 'false',
        first_air_date_year: undefined,
      },
    });
    expect(fuzzy).not.toHaveBeenCalled();
  });
  it('preserves person department, known-for titles and profile artwork', async () => {
    const fetcher = vi.fn().mockResolvedValue(page([person]));
    const result = await createSearchService(fetcher).list(
      searchInput.parse({ query: 'weaver', type: 'person' }),
    );
    expect(result.items[0]).toEqual({
      id: 7,
      type: 'person',
      name: 'Sigourney Weaver',
      profileUrl: 'https://image.tmdb.org/t/p/w342/photo.jpg',
      department: 'Acting',
      knownFor: ['Alien'],
    });
  });
  it('keeps year-filtered multi-search movie/TV/person fanout', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(page([movie]))
      .mockResolvedValueOnce(page([series]))
      .mockResolvedValueOnce(page([person]));
    const result = await createSearchService(fetcher).list(
      searchInput.parse({ query: 'alien 1979' }),
    );
    expect(result.items.map((item) => item.type).sort()).toEqual(['movie', 'person', 'tv']);
    expect(fetcher).not.toHaveBeenCalledWith('/search/multi', expect.anything());
  });
  it('hydrates index-only typo matches with the same shared fallback behavior', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(page([])).mockResolvedValueOnce(movie);
    const fuzzy = vi.fn().mockResolvedValue([
      {
        tmdbId: 42,
        mediaType: 'movie',
        title: 'Alien',
        popularity: 10,
        similarity: 0.7,
        score: 1,
      },
    ]);
    const result = await createSearchService(fetcher, fuzzy).list(
      searchInput.parse({ query: 'alieen' }),
    );
    expect(result.items[0]).toMatchObject({ id: 42, type: 'movie', title: 'Alien' });
    expect(result.totalPages).toBe(1);
    expect(fetcher).toHaveBeenCalledWith('/movie/42');
  });
  it('degrades to TMDB when the optional index fails, and rejects invalid upstream IDs', async () => {
    const fetcher = vi.fn().mockResolvedValue(page([movie]));
    const fuzzy = vi.fn().mockRejectedValue(new Error('index offline'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(
      (await createSearchService(fetcher, fuzzy).list(searchInput.parse({ query: 'alien' }))).items,
    ).toHaveLength(1);
    log.mockRestore();
    fetcher.mockResolvedValueOnce(page([{ ...movie, id: -1 }]));
    await expect(
      createSearchService(fetcher).list(searchInput.parse({ query: 'alien' })),
    ).rejects.toThrow();
  });
});
