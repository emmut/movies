import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./tmdb', () => ({
  tmdbFetch: vi.fn(),
}));
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

import { tmdbFetch } from './tmdb';

import { getMediaCertification, getMediaReviews } from './media-info';

const mockedFetch = vi.mocked(tmdbFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getMediaReviews', () => {
  it('returns the reviews with total and page counts, requesting page 1 by default', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ id: 'r1' }],
      total_results: 12,
      total_pages: 2,
    } as never);

    await expect(getMediaReviews('movie', 603)).resolves.toEqual({
      reviews: [{ id: 'r1' }],
      totalResults: 12,
      totalPages: 2,
    });
    expect(mockedFetch).toHaveBeenCalledWith(
      '/movie/603/reviews',
      expect.objectContaining({ searchParams: { page: '1' } }),
    );
  });

  it('targets the tv endpoint and passes the requested page', async () => {
    mockedFetch.mockResolvedValue({ results: [], total_results: 0, total_pages: 0 } as never);

    await expect(getMediaReviews('tv', 1396, 3)).resolves.toEqual({
      reviews: [],
      totalResults: 0,
      totalPages: 0,
    });
    expect(mockedFetch).toHaveBeenCalledWith(
      '/tv/1396/reviews',
      expect.objectContaining({ searchParams: { page: '3' } }),
    );
  });
});

describe('getMediaCertification', () => {
  it('picks a movie certification from release dates', async () => {
    mockedFetch.mockResolvedValue({
      results: [
        {
          iso_3166_1: 'SE',
          release_dates: [{ certification: '15', iso_639_1: '', release_date: '', type: 3 }],
        },
      ],
    } as never);

    await expect(getMediaCertification('movie', 603, 'SE')).resolves.toEqual({
      value: '15',
      region: 'SE',
    });
    expect(mockedFetch).toHaveBeenCalledWith('/movie/603/release_dates', expect.anything());
  });

  it('picks a tv rating from content ratings, falling back to US', async () => {
    mockedFetch.mockResolvedValue({
      results: [{ iso_3166_1: 'US', rating: 'TV-MA' }],
    } as never);

    await expect(getMediaCertification('tv', 1396, 'SE')).resolves.toEqual({
      value: 'TV-MA',
      region: 'US',
    });
    expect(mockedFetch).toHaveBeenCalledWith('/tv/1396/content_ratings', expect.anything());
  });

  it('returns null for an unrated title', async () => {
    mockedFetch.mockResolvedValue({ results: [] } as never);
    await expect(getMediaCertification('movie', 603, 'SE')).resolves.toBeNull();
  });
});
