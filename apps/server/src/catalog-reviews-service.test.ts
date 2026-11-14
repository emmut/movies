import { createCatalogReviewsService } from '@server/catalog-reviews-service';
import { describe, expect, it, vi } from 'vite-plus/test';

const upstreamReview = {
  id: 'review-7',
  author: 'A reviewer',
  author_details: { rating: 0, username: 'private field' },
  content: 'A thoughtful review.\nWith a second paragraph.',
  created_at: '2026-10-28T12:00:00Z',
  url: 'javascript:alert(1)',
};
const upstreamPage = { results: [upstreamReview], total_pages: 2, total_results: 22 };

describe('catalog reviews service', () => {
  it.each(['movie', 'tv'] as const)(
    'normalizes %s reviews in upstream order, retaining zero ratings and paragraphs',
    async (type) => {
      const fetcher = vi.fn().mockResolvedValue(upstreamPage);
      expect(await createCatalogReviewsService(fetcher).reviews({ id: 42, type, page: 2 })).toEqual(
        {
          page: 2,
          totalPages: 2,
          totalResults: 22,
          reviews: [
            {
              id: 'review-7',
              author: 'A reviewer',
              rating: 0,
              content: upstreamReview.content,
              createdAt: upstreamReview.created_at,
              url: 'https://www.themoviedb.org/review/review-7',
            },
          ],
        },
      );
      expect(fetcher).toHaveBeenCalledExactlyOnceWith(`/${type}/42/reviews`, {
        searchParams: { page: '2' },
      });
    },
  );

  it('handles anonymous authors and missing ratings and encodes attribution IDs', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ...upstreamPage,
      results: [{ ...upstreamReview, id: 'id/with?#characters', author: '  ', author_details: {} }],
    });
    const result = await createCatalogReviewsService(fetcher).reviews({
      id: 42,
      type: 'movie',
      page: 1,
    });
    expect(result.reviews[0]).toMatchObject({
      author: 'Anonymous',
      rating: null,
      url: 'https://www.themoviedb.org/review/id%2Fwith%3F%23characters',
    });
  });

  it('returns the last available page for an out-of-range direct link', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ...upstreamPage, results: [] })
      .mockResolvedValueOnce(upstreamPage);
    const result = await createCatalogReviewsService(fetcher).reviews({
      id: 42,
      type: 'tv',
      page: 500,
    });
    expect(result.page).toBe(2);
    expect(result.reviews).toHaveLength(1);
    expect(fetcher).toHaveBeenNthCalledWith(1, '/tv/42/reviews', { searchParams: { page: '500' } });
    expect(fetcher).toHaveBeenNthCalledWith(2, '/tv/42/reviews', { searchParams: { page: '2' } });
  });

  it('caps navigable pages at the upstream page limit', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ...upstreamPage, total_pages: 700 });
    expect(
      (await createCatalogReviewsService(fetcher).reviews({ id: 42, type: 'movie', page: 500 }))
        .totalPages,
    ).toBe(500);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('reports a genuinely empty collection and reconciles high empty-page requests to page one', async () => {
    const fetcher = vi.fn().mockResolvedValue({ results: [], total_pages: 0, total_results: 0 });
    const service = createCatalogReviewsService(fetcher);
    expect(await service.reviews({ id: 42, type: 'movie', page: 1 })).toEqual({
      page: 1,
      reviews: [],
      totalPages: 0,
      totalResults: 0,
    });
    expect(await service.reviews({ id: 42, type: 'movie', page: 5 })).toEqual({
      page: 1,
      reviews: [],
      totalPages: 0,
      totalResults: 0,
    });
    expect(fetcher).toHaveBeenLastCalledWith('/movie/42/reviews', { searchParams: { page: '1' } });
  });

  it('does not turn malformed data, outages or a failed reconciliation into empty success', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ...upstreamPage, results: 'invalid' })
      .mockRejectedValueOnce(new Error('private outage'))
      .mockResolvedValueOnce({ ...upstreamPage, results: [] })
      .mockRejectedValueOnce(new Error('last page failed'));
    const service = createCatalogReviewsService(fetcher);
    await expect(service.reviews({ id: 42, type: 'movie', page: 1 })).rejects.toThrow();
    await expect(service.reviews({ id: 42, type: 'movie', page: 1 })).rejects.toThrow(
      'private outage',
    );
    await expect(service.reviews({ id: 42, type: 'movie', page: 5 })).rejects.toThrow(
      'last page failed',
    );
  });
});
