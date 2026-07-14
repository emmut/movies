import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./tmdb', () => ({
  tmdbFetch: vi.fn(),
  addPosterImageUrls: vi.fn((item: object) => ({ ...item, _poster: true })),
  addProfileImageUrls: vi.fn((item: object) => ({ ...item, _profile: true })),
}));

import { getSearchMovies, getSearchMulti, getSearchPersons, getSearchTvShows } from './search';
import { addPosterImageUrls, addProfileImageUrls, tmdbFetch } from './tmdb';

const mockedFetch = vi.mocked(tmdbFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

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
