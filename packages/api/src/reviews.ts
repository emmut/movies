import { z } from 'zod';

import { catalogTitleInput } from './catalog-support';

export const reviewsInput = catalogTitleInput.extend({
  page: z.number().int().min(1).max(500).default(1),
});
export type ReviewsInput = z.infer<typeof reviewsInput>;

const reviewSchema = z.object({
  id: z.string().min(1),
  author: z.string(),
  rating: z.number().min(0).max(10).nullable(),
  content: z.string(),
  createdAt: z.string(),
  url: z.string().url().startsWith('https://www.themoviedb.org/review/'),
});
export type Review = z.infer<typeof reviewSchema>;
export const reviewsPageSchema = z.object({
  reviews: z.array(reviewSchema),
  page: z.number().int().positive(),
  totalPages: z.number().int().min(0).max(500),
  totalResults: z.number().int().nonnegative(),
});
export type ReviewsPage = z.infer<typeof reviewsPageSchema>;

// Raw TMDB types stay shared; the web adapter retains its existing cache behavior.
export type TmdbReview = {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
  url: string;
};
export type TmdbReviewsResponse = {
  id: number;
  page: number;
  results: TmdbReview[];
  total_pages: number;
  total_results: number;
};
