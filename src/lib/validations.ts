import { z } from 'zod/v4';

/**
 * Validates that a movieId is a valid string that can be converted to a positive integer.
 * Movie IDs from TMDB are numeric but often passed as strings in URL parameters.
 * Transforms the string to a number for database storage.
 */
export const resourceIdSchema = z.object({
  resourceId: z.number().positive('Resource ID must be a positive number'),
  resourceType: z.enum(['movie', 'tv']),
});

/**
 * Schema for validating resourceId as a number directly
 */
export const resourceIdNumberSchema = z
  .number()
  .positive('Resource ID must be a positive number');

export const resourceTypeSchema = z.enum(['movie', 'tv']);

/**
 * Schema for movie page route parameters
 */
export const resourcePageParamsSchema = z.object({
  resourceId: resourceIdNumberSchema,
  resourceType: resourceTypeSchema,
});

export type ResourcePageParams = z.infer<typeof resourcePageParamsSchema>;
