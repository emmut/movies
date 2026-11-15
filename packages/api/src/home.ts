import { DEFAULT_REGION, regionSchema } from '@movies/config/regions';
import { z } from 'zod';

export const HOME_SECTIONS = [
  {
    heading: 'Movies in Theaters',
    caption: 'Now playing',
    type: 'movie',
    category: 'now-playing-movies',
  },
  {
    heading: 'TV Shows on Air',
    caption: 'Currently airing',
    type: 'tv',
    category: 'on-the-air-tv',
  },
  {
    heading: 'Coming Soon',
    caption: 'Upcoming movies',
    type: 'movie',
    category: 'upcoming-movies',
  },
  { heading: 'Popular TV Shows', caption: 'Trending series', type: 'tv', category: 'popular-tv' },
  {
    heading: 'Top Rated Movies',
    caption: 'All-time favorites',
    type: 'movie',
    category: 'top-rated-movies',
  },
  {
    heading: 'Top Rated TV Shows',
    caption: 'Highest rated series',
    type: 'tv',
    category: 'top-rated-tv',
  },
] as const;

export type HomeMediaSection = (typeof HOME_SECTIONS)[number];

export const homeCategorySchema = z.enum([
  'now-playing-movies',
  'on-the-air-tv',
  'upcoming-movies',
  'popular-tv',
  'top-rated-movies',
  'top-rated-tv',
]);
export type HomeMediaCategory = z.infer<typeof homeCategorySchema>;
export const homeListInput = z.object({
  category: homeCategorySchema,
  region: regionSchema.default(DEFAULT_REGION),
});
export const trendingInput = z.object({ type: z.enum(['movie', 'tv']) });

export const mediaCardSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(['movie', 'tv']),
  title: z.string(),
  releaseDate: z.string(),
  posterUrl: z.string().nullable(),
  backdropUrl: z.string().nullable(),
  rating: z.number(),
});
export type MediaCard = z.infer<typeof mediaCardSchema>;

/** Match the web card/detail score: round upward to one decimal place. */
export function displayRating(rating: number) {
  return Math.ceil(rating * 10) / 10;
}
