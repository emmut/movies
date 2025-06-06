import { z } from 'zod/v4';

/**
 * Validates that a movieId is a valid string that can be converted to a positive integer.
 * Movie IDs from TMDB are numeric but often passed as strings in URL parameters.
 * Transforms the string to a number for database storage.
 */
export const movieIdSchema = z
  .number()
  .positive('Movie ID must be a positive number');

/**
 * Schema for validating movieId as a number directly
 */
export const movieIdNumberSchema = z
  .number()
  .positive('Movie ID must be a positive number');

/**
 * Schema for movie page route parameters
 */
export const moviePageParamsSchema = z.object({
  movieId: movieIdSchema,
});

export type MoviePageParams = z.infer<typeof moviePageParamsSchema>;
