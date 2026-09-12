import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

vi.mock('./tmdb', () => ({
  tmdbFetch: vi.fn(),
  addPosterImageUrls: vi.fn((item: object) => ({ ...item, _poster: true })),
  addProfileImageUrls: vi.fn((item: object) => ({ ...item, _profile: true })),
}));
// The fuzzy index is a fallback; by default it finds nothing so the TMDB
// paths below behave as before.
vi.mock('./search-index', () => ({ searchIndexResults: vi.fn() }));

import {
  getSearchMovies,
  getSearchMulti,
  getSearchPersons,
  getSearchSuggestions,
  getSearchTvShows,
} from './search';
import { searchIndexResults } from './search-index';
import { addPosterImageUrls, addProfileImageUrls, tmdbFetch } from './tmdb';

const mockedFetch = vi.mocked(tmdbFetch);
const mockedFuzzy = vi.mocked(searchIndexResults);

beforeEach(() => {
  vi.clearAllMocks();
  mockedFuzzy.mockResolvedValue([]);
});

const NO_RESULTS = { results: [], total_pages: 0, total_results: 0 };

describe('getSearchMovies', () => {
  it('maps poster urls onto every result and surfaces total pages', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 1 }, { id: 2 }],
      total_pages: 7,
      total_results: 2,
    } as never);

    const result = await getSearchMovies('matrix', 2);

    expect(result.totalPages).toBe(7);
    expect(result.movies).toEqual([
      { id: 1, _poster: true },
      { id: 2, _poster: true },
    ]);
    // Page coerced to a string for the TMDB query.
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/movie',
      expect.objectContaining({
        searchParams: expect.objectContaining({ query: 'matrix', page: '2' }),
      }),
    );
    expect(addPosterImageUrls).toHaveBeenCalledTimes(2);
  });

  it('defaults to page 1', async () => {
    mockedFetch.mockResolvedValue({ results: [], total_pages: 1, total_results: 0 } as never);
    await getSearchMovies('q');
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/movie',
      expect.objectContaining({ searchParams: expect.objectContaining({ page: '1' }) }),
    );
  });

  it('uses a trailing year as a release-year filter', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 949 }],
      total_pages: 1,
      total_results: 1,
    } as never);

    const result = await getSearchMovies('heat 1995');

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/movie',
      expect.objectContaining({
        searchParams: expect.objectContaining({ query: 'heat', primary_release_year: 1995 }),
      }),
    );
    expect(result.movies).toEqual([{ id: 949, _poster: true }]);
  });

  it('retries the raw query when the year-filtered search has no matches', async () => {
    mockedFetch
      .mockResolvedValueOnce({ results: [], total_pages: 1, total_results: 0 } as never)
      .mockResolvedValueOnce({ results: [{ id: 5 }], total_pages: 1, total_results: 1 } as never);

    const result = await getSearchMovies('blade runner 2026');

    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedFetch).toHaveBeenLastCalledWith(
      '/search/movie',
      expect.objectContaining({
        searchParams: expect.objectContaining({
          query: 'blade runner 2026',
          primary_release_year: undefined,
        }),
      }),
    );
    expect(result.movies).toEqual([{ id: 5, _poster: true }]);
  });

  it('does not apply a year filter for plain queries', async () => {
    mockedFetch.mockResolvedValue({ results: [], total_pages: 1, total_results: 0 } as never);

    await getSearchMovies('matrix');

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/movie',
      expect.objectContaining({
        searchParams: expect.objectContaining({ primary_release_year: undefined }),
      }),
    );
  });
});

describe('getSearchTvShows', () => {
  it('uses a trailing year as a first-air-date filter', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 2316 }],
      total_pages: 1,
      total_results: 1,
    } as never);

    const result = await getSearchTvShows('the office 2005');

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/tv',
      expect.objectContaining({
        searchParams: expect.objectContaining({ query: 'the office', first_air_date_year: 2005 }),
      }),
    );
    expect(result.tvShows).toEqual([{ id: 2316, _poster: true }]);
  });

  it('retries the raw query when the year-filtered search has no matches', async () => {
    mockedFetch
      .mockResolvedValueOnce({ results: [], total_pages: 1, total_results: 0 } as never)
      .mockResolvedValueOnce({ results: [{ id: 8 }], total_pages: 2, total_results: 21 } as never);

    const result = await getSearchTvShows('lost 1999');

    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedFetch).toHaveBeenLastCalledWith(
      '/search/tv',
      expect.objectContaining({
        searchParams: expect.objectContaining({
          query: 'lost 1999',
          first_air_date_year: undefined,
        }),
      }),
    );
    expect(result).toEqual({ tvShows: [{ id: 8, _poster: true }], totalPages: 2 });
  });
});

describe('getSearchPersons', () => {
  it('maps profile urls onto results', async () => {
    mockedFetch.mockResolvedValue({ results: [{ id: 9 }], total_pages: 1 } as never);
    const result = await getSearchPersons('keanu');
    expect(result.persons).toEqual([{ id: 9, _profile: true }]);
    expect(addProfileImageUrls).toHaveBeenCalledTimes(1);
  });
});

describe('getSearchMulti routing by media_type', () => {
  it('applies profile urls to persons, poster urls to movie/tv, and passes others through', async () => {
    mockedFetch.mockResolvedValue({
      results: [
        { id: 1, media_type: 'person' },
        { id: 2, media_type: 'movie' },
        { id: 3, media_type: 'tv' },
        { id: 4, media_type: 'collection' },
      ],
      total_pages: 1,
    } as never);

    const result = await getSearchMulti('mixed');

    expect(result.results).toEqual([
      { id: 1, media_type: 'person', _profile: true },
      { id: 2, media_type: 'movie', _poster: true },
      { id: 3, media_type: 'tv', _poster: true },
      { id: 4, media_type: 'collection' },
    ]);
  });
});

describe('getSearchMulti with a trailing year', () => {
  it('searches movies, tv, and persons and merges by popularity', async () => {
    mockedFetch.mockImplementation((path: string) => {
      if (path === '/search/movie') {
        return Promise.resolve({
          results: [{ id: 1, popularity: 10 }],
          total_pages: 3,
          total_results: 41,
        });
      }
      if (path === '/search/person') {
        return Promise.resolve({
          results: [{ id: 4, popularity: 99 }],
          total_pages: 1,
          total_results: 1,
        });
      }
      return Promise.resolve({
        results: [
          { id: 2, popularity: 50 },
          { id: 3, popularity: 5 },
        ],
        total_pages: 2,
        total_results: 22,
      });
    });

    const result = await getSearchMulti('heat 1995');

    expect(mockedFetch).toHaveBeenCalledTimes(3);
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/movie',
      expect.objectContaining({
        searchParams: expect.objectContaining({ query: 'heat', primary_release_year: 1995 }),
      }),
    );
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/tv',
      expect.objectContaining({
        searchParams: expect.objectContaining({ query: 'heat', first_air_date_year: 1995 }),
      }),
    );
    // Person search gets the year-stripped title; persons have no year filter.
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/person',
      expect.objectContaining({ searchParams: expect.objectContaining({ query: 'heat' }) }),
    );
    expect(result.results).toEqual([
      { id: 4, popularity: 99, media_type: 'person', _profile: true },
      { id: 2, popularity: 50, media_type: 'tv', _poster: true },
      { id: 1, popularity: 10, media_type: 'movie', _poster: true },
      { id: 3, popularity: 5, media_type: 'tv', _poster: true },
    ]);
    expect(result.totalPages).toBe(3);
  });

  it('keeps person matches even when movie and tv searches are empty', async () => {
    mockedFetch.mockImplementation((path: string) => {
      if (path === '/search/person') {
        return Promise.resolve({
          results: [{ id: 287, popularity: 80 }],
          total_pages: 1,
          total_results: 1,
        });
      }
      return Promise.resolve({ results: [], total_pages: 1, total_results: 0 });
    });

    const result = await getSearchMulti('brad pitt 1995');

    expect(mockedFetch).toHaveBeenCalledTimes(3);
    expect(mockedFetch).not.toHaveBeenCalledWith('/search/multi', expect.anything());
    expect(result.results).toEqual([
      { id: 287, popularity: 80, media_type: 'person', _profile: true },
    ]);
  });

  it('narrows to the movie endpoint for a media-type keyword with a year', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 949, popularity: 30 }],
      total_pages: 1,
      total_results: 1,
    } as never);

    const result = await getSearchMulti('heat movie 1995');

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/movie',
      expect.objectContaining({
        searchParams: expect.objectContaining({ query: 'heat', primary_release_year: 1995 }),
      }),
    );
    expect(result.results).toEqual([
      { id: 949, popularity: 30, media_type: 'movie', _poster: true },
    ]);
  });

  it('falls back to a plain multi search when all year-path searches are empty', async () => {
    mockedFetch.mockImplementation((path: string) => {
      if (path === '/search/multi') {
        return Promise.resolve({
          results: [{ id: 7, media_type: 'movie' }],
          total_pages: 1,
        });
      }
      return Promise.resolve({ results: [], total_pages: 1, total_results: 0 });
    });

    const result = await getSearchMulti('blade runner 2026');

    expect(mockedFetch).toHaveBeenCalledTimes(4);
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/multi',
      expect.objectContaining({
        searchParams: expect.objectContaining({ query: 'blade runner 2026' }),
      }),
    );
    expect(result.results).toEqual([{ id: 7, media_type: 'movie', _poster: true }]);
  });
});

describe('close title matches rank first', () => {
  const ALIEN_PAGE = {
    results: [
      { id: 1, title: 'Alien: Romulus', popularity: 900 },
      { id: 2, title: 'Aliens', popularity: 300 },
      { id: 3, title: 'Alien', popularity: 200 },
      { id: 4, title: 'Predator', popularity: 100 },
    ],
    total_pages: 4,
    total_results: 80,
  };

  function ids(results: { id: number }[]) {
    return results.map((result) => result.id);
  }

  it('getSearchMovies puts the exact title ahead of TMDB’s popularity order', async () => {
    mockedFetch.mockResolvedValue(ALIEN_PAGE as never);

    const result = await getSearchMovies('alien');

    expect(ids(result.movies)).toEqual([3, 1, 2, 4]);
    expect(result.totalPages).toBe(4);
  });

  it('re-ranks every page, not only the first', async () => {
    mockedFetch.mockResolvedValue(ALIEN_PAGE as never);

    const result = await getSearchMovies('alien', 3);

    expect(ids(result.movies)).toEqual([3, 1, 2, 4]);
  });

  it('ranks the year-filtered movie page against the parsed title', async () => {
    mockedFetch.mockResolvedValue(ALIEN_PAGE as never);

    const result = await getSearchMovies('alien 1979');

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(ids(result.movies)).toEqual([3, 1, 2, 4]);
  });

  it('ranks the raw retry against the parsed title, not the raw query', async () => {
    mockedFetch
      .mockResolvedValueOnce(NO_RESULTS as never)
      .mockResolvedValueOnce(ALIEN_PAGE as never);

    const result = await getSearchMovies('alien 2027');

    expect(ids(result.movies)).toEqual([3, 1, 2, 4]);
  });

  it('getSearchTvShows ranks by name and original_name', async () => {
    mockedFetch.mockResolvedValue({
      results: [
        { id: 1, name: 'Dark Matter', original_name: 'Dark Matter' },
        { id: 2, name: 'Darkness', original_name: 'Mørke' },
        { id: 3, name: 'The Dark', original_name: 'Dark' },
      ],
      total_pages: 1,
      total_results: 3,
    } as never);

    const result = await getSearchTvShows('dark');

    expect(ids(result.tvShows)).toEqual([3, 1, 2]);
  });

  it('getSearchTvShows ranks the year-filtered page too', async () => {
    mockedFetch.mockResolvedValue({
      results: [
        { id: 1, name: 'Dark Matter' },
        { id: 2, name: 'Dark' },
      ],
      total_pages: 1,
      total_results: 2,
    } as never);

    const result = await getSearchTvShows('dark 2017');

    expect(ids(result.tvShows)).toEqual([2, 1]);
  });

  it('getSearchPersons ranks by name, on both the stripped and raw paths', async () => {
    const page = {
      results: [
        { id: 1, name: 'Brad Pitt' },
        { id: 2, name: 'Brad' },
      ],
      total_pages: 1,
      total_results: 2,
    };
    mockedFetch.mockResolvedValue(page as never);

    expect(ids((await getSearchPersons('brad')).persons)).toEqual([2, 1]);
    expect(ids((await getSearchPersons('brad person')).persons)).toEqual([2, 1]);
  });

  it('getSearchMulti ranks the plain multi page against the parsed title', async () => {
    mockedFetch.mockResolvedValue({
      results: [
        { id: 1, media_type: 'movie', title: 'Alien: Romulus' },
        { id: 2, media_type: 'person', name: 'Alien Ant Farm' },
        { id: 3, media_type: 'tv', name: 'Alien' },
        { id: 4, media_type: 'collection', name: 'Alien Collection' },
      ],
      total_pages: 1,
    } as never);

    const result = await getSearchMulti('alien');

    expect(ids(result.results)).toEqual([3, 1, 2, 4]);
  });

  it('getSearchMulti ranks the media-type-narrowed pages', async () => {
    mockedFetch.mockResolvedValue(ALIEN_PAGE as never);
    expect(ids((await getSearchMulti('alien movie')).results)).toEqual([3, 1, 2, 4]);

    mockedFetch.mockResolvedValue({
      results: [
        { id: 1, name: 'Dark Matter' },
        { id: 2, name: 'Dark' },
      ],
      total_pages: 1,
      total_results: 2,
    } as never);
    expect(ids((await getSearchMulti('dark tv')).results)).toEqual([2, 1]);

    mockedFetch.mockResolvedValue({
      results: [
        { id: 1, name: 'Brad Pitt' },
        { id: 2, name: 'Brad' },
      ],
      total_pages: 1,
      total_results: 2,
    } as never);
    expect(ids((await getSearchMulti('brad person')).results)).toEqual([2, 1]);
  });

  it('year fan-out ranks by title match first and popularity within a tier', async () => {
    mockedFetch.mockImplementation((path: string) => {
      if (path === '/search/movie') {
        return Promise.resolve({
          results: [
            { id: 1, title: 'Heat Wave', popularity: 90 },
            { id: 2, title: 'Heat', popularity: 10 },
          ],
          total_pages: 1,
          total_results: 2,
        });
      }
      if (path === '/search/tv') {
        return Promise.resolve({
          results: [{ id: 3, name: 'Heat', popularity: 40 }],
          total_pages: 1,
          total_results: 1,
        });
      }
      return Promise.resolve({
        results: [{ id: 4, name: 'Heather Graham', popularity: 99 }],
        total_pages: 1,
        total_results: 1,
      });
    });

    const result = await getSearchMulti('heat 1995');

    // Exact "Heat" hits first (tv 40 over movie 10 by popularity), then the
    // word-prefix "Heat Wave", then the prefix-only person.
    expect(ids(result.results)).toEqual([3, 2, 1, 4]);
  });

  it('getSearchSuggestions uses the same ranking', async () => {
    mockedFetch.mockResolvedValue({
      results: [
        { id: 1, media_type: 'movie', title: 'Alien: Romulus' },
        { id: 2, media_type: 'movie', title: 'Alien' },
      ],
      total_pages: 1,
    } as never);

    const result = await getSearchSuggestions('alien');

    expect(ids(result.results)).toEqual([2, 1]);
  });
});

describe('getSearchMulti with a media-type keyword', () => {
  it('narrows to the tv endpoint for tv keywords', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 2316, popularity: 100 }],
      total_pages: 2,
      total_results: 25,
    } as never);

    const result = await getSearchMulti('the office tv show');

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/tv',
      expect.objectContaining({
        searchParams: expect.objectContaining({
          query: 'the office',
          first_air_date_year: undefined,
        }),
      }),
    );
    expect(result).toEqual({
      results: [{ id: 2316, popularity: 100, media_type: 'tv', _poster: true }],
      totalPages: 2,
    });
  });

  it('narrows to the person endpoint for person keywords', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 287, popularity: 80 }],
      total_pages: 1,
      total_results: 1,
    } as never);

    const result = await getSearchMulti('brad pitt person');

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/person',
      expect.objectContaining({ searchParams: expect.objectContaining({ query: 'brad pitt' }) }),
    );
    expect(result.results).toEqual([
      { id: 287, popularity: 80, media_type: 'person', _profile: true },
    ]);
  });

  it('falls back to a plain multi search when the narrowed search is empty', async () => {
    mockedFetch.mockImplementation((path: string) => {
      if (path === '/search/multi') {
        return Promise.resolve({
          results: [{ id: 9, media_type: 'movie' }],
          total_pages: 1,
        });
      }
      return Promise.resolve({ results: [], total_pages: 1, total_results: 0 });
    });

    const result = await getSearchMulti('village movi');

    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/multi',
      expect.objectContaining({
        searchParams: expect.objectContaining({ query: 'village movi' }),
      }),
    );
    expect(result.results).toEqual([{ id: 9, media_type: 'movie', _poster: true }]);
  });
});

describe('media-type keywords on single-type searches', () => {
  it('strips the keyword on the movie search', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 949 }],
      total_pages: 1,
      total_results: 1,
    } as never);

    await getSearchMovies('heat movie');

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/movie',
      expect.objectContaining({ searchParams: expect.objectContaining({ query: 'heat' }) }),
    );
  });

  it('strips the keyword and year on the person search', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 287 }],
      total_pages: 1,
      total_results: 1,
    } as never);

    await getSearchPersons('brad pitt person 1995');

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/person',
      expect.objectContaining({ searchParams: expect.objectContaining({ query: 'brad pitt' }) }),
    );
  });

  it('retries the person search with the raw query when stripping finds nothing', async () => {
    mockedFetch
      .mockResolvedValueOnce({ results: [], total_pages: 1, total_results: 0 } as never)
      .mockResolvedValueOnce({ results: [{ id: 5 }], total_pages: 1, total_results: 1 } as never);

    const result = await getSearchPersons('mr person');

    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedFetch).toHaveBeenLastCalledWith(
      '/search/person',
      expect.objectContaining({ searchParams: expect.objectContaining({ query: 'mr person' }) }),
    );
    expect(result.persons).toEqual([{ id: 5, _profile: true }]);
  });
});

describe('fuzzy fallback', () => {
  const fuzzyMovie = { id: 157336, title: 'Interstellar', media_type: 'movie' as const };
  const fuzzyPerson = { id: 287, name: 'Brad Pitt', media_type: 'person' as const };

  it('getSearchMovies falls back to the index when TMDB finds nothing on page 1', async () => {
    mockedFetch.mockResolvedValue(NO_RESULTS as never);
    mockedFuzzy.mockResolvedValue([fuzzyMovie as never]);

    const result = await getSearchMovies('intersteller');

    expect(mockedFuzzy).toHaveBeenCalledWith('intersteller', { mediaType: 'movie', limit: 10 });
    expect(result.movies).toEqual([{ ...fuzzyMovie, _poster: true }]);
    expect(result.totalPages).toBe(1);
  });

  it('passes the parsed title (year and type stripped) to the index', async () => {
    mockedFetch.mockResolvedValue(NO_RESULTS as never);

    await getSearchMovies('intersteller 2014 movie');

    expect(mockedFuzzy).toHaveBeenCalledWith('intersteller', expect.anything());
  });

  it('does not consult the index for a year-filtered query when TMDB has results', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 1 }],
      total_pages: 1,
      total_results: 1,
    } as never);

    await getSearchMovies('matrix 1999');

    expect(mockedFuzzy).not.toHaveBeenCalled();
  });

  it('does consult the index for a year-filtered query when TMDB has nothing', async () => {
    mockedFetch.mockResolvedValue(NO_RESULTS as never);
    mockedFuzzy.mockResolvedValue([fuzzyMovie as never]);

    const result = await getSearchMovies('intersteller 2014');

    expect(mockedFuzzy).toHaveBeenCalledWith('intersteller', { mediaType: 'movie', limit: 10 });
    expect(result.movies).toEqual([{ ...fuzzyMovie, _poster: true }]);
  });

  it('does not consult the index beyond the first page', async () => {
    mockedFetch.mockResolvedValue(NO_RESULTS as never);

    const result = await getSearchMovies('matrix', 3);

    expect(mockedFuzzy).not.toHaveBeenCalled();
    expect(result.movies).toEqual([]);
  });

  it('getSearchTvShows and getSearchPersons fall back with their media type', async () => {
    mockedFetch.mockResolvedValue(NO_RESULTS as never);
    mockedFuzzy.mockResolvedValue([fuzzyPerson as never]);

    await getSearchTvShows('brekaing bad');
    expect(mockedFuzzy).toHaveBeenLastCalledWith('brekaing bad', { mediaType: 'tv', limit: 10 });

    const persons = await getSearchPersons('brad pit');
    expect(mockedFuzzy).toHaveBeenLastCalledWith('brad pit', { mediaType: 'person', limit: 10 });
    expect(persons.persons).toEqual([{ ...fuzzyPerson, _profile: true }]);
  });

  it('keeps only results of the requested media type', async () => {
    mockedFetch.mockResolvedValue(NO_RESULTS as never);
    mockedFuzzy.mockResolvedValue([fuzzyPerson as never, fuzzyMovie as never]);

    const result = await getSearchMovies('x');

    expect(result.movies).toEqual([{ ...fuzzyMovie, _poster: true }]);
  });

  it('getSearchMulti falls back to the index with the parsed media type', async () => {
    mockedFetch.mockResolvedValue(NO_RESULTS as never);
    mockedFuzzy.mockResolvedValue([fuzzyMovie as never, fuzzyPerson as never]);

    const result = await getSearchMulti('intersteller');

    expect(mockedFuzzy).toHaveBeenCalledWith('intersteller', { mediaType: undefined, limit: 10 });
    expect(result.results).toEqual([
      { ...fuzzyMovie, _poster: true },
      { ...fuzzyPerson, _profile: true },
    ]);
    expect(result.totalPages).toBe(1);
  });

  it('getSearchMulti reports TMDB’s empty page when the index has nothing either', async () => {
    mockedFetch.mockResolvedValue(NO_RESULTS as never);

    const result = await getSearchMulti('zzzz');

    expect(result.results).toEqual([]);
    expect(result.totalPages).toBe(0);
  });

  it('degrades to TMDB’s empty result when the index itself fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedFetch.mockResolvedValue(NO_RESULTS as never);
    mockedFuzzy.mockRejectedValue(new Error('relation "search_index" does not exist'));

    const result = await getSearchMovies('matrix');

    expect(result.movies).toEqual([]);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('index merged into the first page', () => {
  const ALIEN_PAGE = {
    results: [
      { id: 1, title: 'Alien: Romulus' },
      { id: 2, title: 'Aliens' },
    ],
    total_pages: 5,
    total_results: 90,
  };
  const indexAlien = { id: 348, title: 'Alien', media_type: 'movie' as const };
  const indexAliens = { id: 2, title: 'Aliens', media_type: 'movie' as const };
  const indexTv = { id: 70, name: 'Alien Nation', media_type: 'tv' as const };

  function ids(results: { id: number }[]) {
    return results.map((result) => result.id);
  }

  it('runs the index alongside TMDB and lifts an exact match TMDB buried on a later page', async () => {
    mockedFetch.mockResolvedValue(ALIEN_PAGE as never);
    mockedFuzzy.mockResolvedValue([indexAlien as never]);

    const result = await getSearchMovies('alien');

    expect(mockedFuzzy).toHaveBeenCalledWith('alien', { mediaType: 'movie', limit: 10 });
    expect(ids(result.movies)).toEqual([348, 1, 2]);
    expect(result.movies[0]).toEqual({ ...indexAlien, _poster: true });
    // TMDB's paging is kept: the index only adds to page 1.
    expect(result.totalPages).toBe(5);
  });

  it('drops index hits TMDB already returned, keyed by media type and id', async () => {
    mockedFetch.mockResolvedValue(ALIEN_PAGE as never);
    mockedFuzzy.mockResolvedValue([indexAliens as never, indexAlien as never]);

    const result = await getSearchMovies('alien');

    expect(ids(result.movies)).toEqual([348, 1, 2]);
    expect(result.movies.filter((movie) => movie.id === 2)).toHaveLength(1);
  });

  it('queues index hits behind TMDB results within the same tier', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 1, title: 'Alien' }],
      total_pages: 1,
      total_results: 1,
    } as never);
    mockedFuzzy.mockResolvedValue([indexAlien as never]);

    const result = await getSearchMovies('alien');

    expect(ids(result.movies)).toEqual([1, 348]);
  });

  it('appends index hits that match no tier (typos) after TMDB’s page', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 1, title: 'Interstellar Wars' }],
      total_pages: 1,
      total_results: 1,
    } as never);
    mockedFuzzy.mockResolvedValue([
      { id: 157336, title: 'Interstellar', media_type: 'movie' } as never,
    ]);

    const result = await getSearchMovies('intersteller');

    expect(ids(result.movies)).toEqual([1, 157336]);
  });

  it('keeps only hits of the requested media type on single-type pages', async () => {
    mockedFetch.mockResolvedValue(ALIEN_PAGE as never);
    mockedFuzzy.mockResolvedValue([indexTv as never, indexAlien as never]);

    const result = await getSearchMovies('alien');

    expect(ids(result.movies)).toEqual([348, 1, 2]);
  });

  it('does not run the index beyond the first page', async () => {
    mockedFetch.mockResolvedValue(ALIEN_PAGE as never);

    const result = await getSearchMovies('alien', 2);

    expect(mockedFuzzy).not.toHaveBeenCalled();
    expect(ids(result.movies)).toEqual([1, 2]);
  });

  it('leaves a year-filtered page alone when TMDB has results (the index has no year data)', async () => {
    mockedFetch.mockResolvedValue(ALIEN_PAGE as never);
    mockedFuzzy.mockResolvedValue([indexAlien as never]);

    const result = await getSearchMovies('alien 1979');

    expect(mockedFuzzy).not.toHaveBeenCalled();
    expect(ids(result.movies)).toEqual([1, 2]);
  });

  it('merges with a media-type keyword, narrowed to that type', async () => {
    mockedFetch.mockResolvedValue(ALIEN_PAGE as never);
    mockedFuzzy.mockResolvedValue([indexAlien as never]);

    const result = await getSearchMovies('alien movie');

    expect(mockedFuzzy).toHaveBeenCalledWith('alien', { mediaType: 'movie', limit: 10 });
    expect(ids(result.movies)).toEqual([348, 1, 2]);
  });

  it('getSearchTvShows and getSearchPersons merge with their media type', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 1, name: 'Alien Worlds' }],
      total_pages: 1,
      total_results: 1,
    } as never);
    mockedFuzzy.mockResolvedValue([indexTv as never, indexAlien as never]);

    const tv = await getSearchTvShows('alien');
    expect(mockedFuzzy).toHaveBeenLastCalledWith('alien', { mediaType: 'tv', limit: 10 });
    expect(ids(tv.tvShows)).toEqual([1, 70]);

    const indexPerson = { id: 9, name: 'Brad Pitt', media_type: 'person' as const };
    mockedFetch.mockResolvedValue({
      results: [{ id: 1, name: 'Brad Pittman' }],
      total_pages: 1,
      total_results: 1,
    } as never);
    mockedFuzzy.mockResolvedValue([indexPerson as never]);

    const persons = await getSearchPersons('brad pitt');
    expect(mockedFuzzy).toHaveBeenLastCalledWith('brad pitt', { mediaType: 'person', limit: 10 });
    expect(ids(persons.persons)).toEqual([9, 1]);
  });

  it('getSearchMulti merges mixed hits into the plain multi page', async () => {
    mockedFetch.mockResolvedValue({
      results: [
        { id: 1, media_type: 'movie', title: 'Alien: Romulus' },
        { id: 348, media_type: 'tv', name: 'Alien Hunters' },
      ],
      total_pages: 3,
    } as never);
    mockedFuzzy.mockResolvedValue([indexAlien as never, indexTv as never]);

    const result = await getSearchMulti('alien');

    expect(mockedFuzzy).toHaveBeenCalledWith('alien', { mediaType: undefined, limit: 10 });
    // Movie 348 is not the same item as tv 348, so both stay.
    expect(result.results).toEqual([
      { ...indexAlien, _poster: true },
      { id: 1, media_type: 'movie', title: 'Alien: Romulus', _poster: true },
      { id: 348, media_type: 'tv', name: 'Alien Hunters', _poster: true },
      { ...indexTv, _poster: true },
    ]);
    expect(result.totalPages).toBe(3);
  });

  it('getSearchMulti merges into a media-type-narrowed page', async () => {
    mockedFetch.mockResolvedValue(ALIEN_PAGE as never);
    mockedFuzzy.mockResolvedValue([indexAlien as never]);

    const result = await getSearchMulti('alien movie');

    expect(mockedFuzzy).toHaveBeenCalledWith('alien', { mediaType: 'movie', limit: 10 });
    expect(ids(result.results)).toEqual([348, 1, 2]);
    expect(result.results.every((item) => item.media_type === 'movie')).toBe(true);
  });

  it('getSearchMulti leaves the year fan-out alone when TMDB has results', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 1, title: 'Heat', popularity: 1 }],
      total_pages: 1,
      total_results: 1,
    } as never);
    mockedFuzzy.mockResolvedValue([indexAlien as never]);

    await getSearchMulti('heat 1995');

    expect(mockedFuzzy).not.toHaveBeenCalled();
  });

  it('keeps TMDB’s page when the index fails mid-merge', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedFetch.mockResolvedValue(ALIEN_PAGE as never);
    mockedFuzzy.mockRejectedValue(new Error('connection refused'));

    const result = await getSearchMovies('alien');

    expect(ids(result.movies)).toEqual([1, 2]);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('getSearchSuggestions', () => {
  const fuzzyMovie = { id: 157336, title: 'Interstellar', media_type: 'movie' as const };

  it('answers from TMDB in one request when it has results, never touching the index', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 1, media_type: 'movie' }],
      total_pages: 1,
      total_results: 1,
    } as never);

    const result = await getSearchSuggestions('interst');

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/multi',
      expect.objectContaining({ searchParams: expect.objectContaining({ query: 'interst' }) }),
    );
    expect(mockedFuzzy).not.toHaveBeenCalled();
    expect(result.results).toEqual([{ id: 1, media_type: 'movie', _poster: true }]);
  });

  it('falls back to a dropdown-sized fuzzy page when TMDB has nothing', async () => {
    mockedFetch.mockResolvedValue(NO_RESULTS as never);
    mockedFuzzy.mockResolvedValue([fuzzyMovie as never]);

    const result = await getSearchSuggestions('intersteller');

    expect(mockedFuzzy).toHaveBeenCalledWith('intersteller', { mediaType: undefined, limit: 8 });
    expect(result).toEqual({ results: [{ ...fuzzyMovie, _poster: true }], totalPages: 1 });
  });

  it('narrows the fuzzy fallback to a media-type keyword in the query', async () => {
    mockedFetch.mockResolvedValue(NO_RESULTS as never);
    mockedFuzzy.mockResolvedValue([fuzzyMovie as never]);

    await getSearchSuggestions('intersteller movie');

    expect(mockedFuzzy).toHaveBeenCalledWith('intersteller', { mediaType: 'movie', limit: 8 });
  });
});
