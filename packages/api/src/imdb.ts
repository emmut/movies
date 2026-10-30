import { z } from 'zod';

export const imdbIdSchema = z.string().regex(/^tt\d{7,}$/);
export const imdbRatingSchema = z.object({
  rating: z.number().min(0).max(10),
  numVotes: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
});
export type ImdbRating = z.infer<typeof imdbRatingSchema>;
export type ImdbRatingReader = (id: string) => Promise<ImdbRating | null>;

export const catalogImdbSchema = z.object({
  url: z.string().url().startsWith('https://www.imdb.com/title/').nullable(),
  rating: imdbRatingSchema.nullable(),
  ratingUnavailable: z.boolean(),
});
export type CatalogImdb = z.infer<typeof catalogImdbSchema>;
