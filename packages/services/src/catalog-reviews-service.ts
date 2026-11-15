import 'server-only';
import type { CatalogService } from '@movies/api/router';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { z } from 'zod';

const upstreamSchema = z.object({
  results: z.array(
    z.object({
      id: z.string().min(1),
      author: z.string(),
      author_details: z.object({ rating: z.number().min(0).max(10).nullable().default(null) }),
      content: z.string(),
      created_at: z.string(),
    }),
  ),
  total_pages: z.number().int().nonnegative(),
  total_results: z.number().int().nonnegative(),
});

export function createCatalogReviewsService(fetchTmdb: TmdbFetch): Pick<CatalogService, 'reviews'> {
  async function load(type: 'movie' | 'tv', id: number, page: number) {
    return upstreamSchema.parse(
      await fetchTmdb<unknown>(`/${type}/${id}/reviews`, {
        searchParams: { page: String(page) },
      }),
    );
  }
  return {
    async reviews({ id, type, page }) {
      let data = await load(type, id, page);
      const currentPage = Math.min(page, Math.max(1, Math.min(500, data.total_pages)));
      if (currentPage !== page) {
        data = await load(type, id, currentPage);
      }
      return {
        page: currentPage,
        totalPages: Math.min(500, data.total_pages),
        totalResults: data.total_results,
        reviews: data.results.map((review) => ({
          id: review.id,
          author: review.author.trim() || 'Anonymous',
          rating: review.author_details.rating,
          content: review.content,
          createdAt: review.created_at,
          // Construct attribution rather than trusting an upstream arbitrary URI scheme.
          url: 'https://www.themoviedb.org/review/' + encodeURIComponent(review.id),
        })),
      };
    },
  };
}
