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

    expect(mockedFuzzy).toHaveBeenCalledWith('intersteller', { mediaType: 'movie', limit: 20 });
    expect(result.movies).toEqual([{ ...fuzzyMovie, _poster: true }]);
    expect(result.totalPages).toBe(1);
  });

  it('passes the parsed title (year and type stripped) to the index', async () => {
    mockedFetch.mockResolvedValue(NO_RESULTS as never);

    await getSearchMovies('intersteller 2014 movie');

    expect(mockedFuzzy).toHaveBeenCalledWith('intersteller', expect.anything());
  });

  it('does not consult the index when TMDB has results', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 1 }],
      total_pages: 1,
      total_results: 1,
    } as never);

    await getSearchMovies('matrix');

    expect(mockedFuzzy).not.toHaveBeenCalled();
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
    expect(mockedFuzzy).toHaveBeenLastCalledWith('brekaing bad', { mediaType: 'tv', limit: 20 });

    const persons = await getSearchPersons('brad pit');
    expect(mockedFuzzy).toHaveBeenLastCalledWith('brad pit', { mediaType: 'person', limit: 20 });
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

    expect(mockedFuzzy).toHaveBeenCalledWith('intersteller', { mediaType: undefined, limit: 20 });
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

describe('getSearchSuggestions', () => {
  const fuzzyMovie = { id: 157336, title: 'Interstellar', media_type: 'movie' as const };

  it('answers from the index without calling TMDB', async () => {
    mockedFuzzy.mockResolvedValue([fuzzyMovie as never]);

    const result = await getSearchSuggestions('interst');

    expect(mockedFuzzy).toHaveBeenCalledWith('interst', { mediaType: undefined, limit: 8 });
    expect(mockedFetch).not.toHaveBeenCalled();
    expect(result).toEqual({ results: [{ ...fuzzyMovie, _poster: true }], totalPages: 1 });
  });

  it('narrows the index to a media-type keyword in the query', async () => {
    mockedFuzzy.mockResolvedValue([fuzzyMovie as never]);

    await getSearchSuggestions('interst movie');

    expect(mockedFuzzy).toHaveBeenCalledWith('interst', { mediaType: 'movie', limit: 8 });
  });

  it('falls back to the TMDB multi search when the index has nothing', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 1, media_type: 'movie' }],
      total_pages: 1,
      total_results: 1,
    } as never);

    const result = await getSearchSuggestions('b');

    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/multi',
      expect.objectContaining({ searchParams: expect.objectContaining({ query: 'b' }) }),
    );
    expect(result.results).toEqual([{ id: 1, media_type: 'movie', _poster: true }]);
  });
});
