import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./tmdb', () => ({
  tmdbFetch: vi.fn(),
  addPosterImageUrls: vi.fn((item: object) => ({ ...item, _poster: true })),
  addProfileImageUrls: vi.fn((item: object) => ({ ...item, _profile: true })),
}));

import { addPosterImageUrls, addProfileImageUrls, tmdbFetch } from './tmdb';

import { getSearchMovies, getSearchMulti, getSearchPersons } from './search';

const mockedFetch = vi.mocked(tmdbFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getSearchMovies', () => {
  it('maps poster urls onto every result and surfaces total pages', async () => {
    mockedFetch.mockResolvedValue({ results: [{ id: 1 }, { id: 2 }], total_pages: 7 } as never);

    const result = await getSearchMovies('matrix', 2);

    expect(result.totalPages).toBe(7);
    expect(result.movies).toEqual([
      { id: 1, _poster: true },
      { id: 2, _poster: true },
    ]);
    // Page coerced to a string for the TMDB query.
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/movie',
      expect.objectContaining({ searchParams: expect.objectContaining({ query: 'matrix', page: '2' }) }),
    );
    expect(addPosterImageUrls).toHaveBeenCalledTimes(2);
  });

  it('defaults to page 1', async () => {
    mockedFetch.mockResolvedValue({ results: [], total_pages: 1 } as never);
    await getSearchMovies('q');
    expect(mockedFetch).toHaveBeenCalledWith(
      '/search/movie',
      expect.objectContaining({ searchParams: expect.objectContaining({ page: '1' }) }),
    );
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
