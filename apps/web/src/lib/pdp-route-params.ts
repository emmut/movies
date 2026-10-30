import { z } from 'zod';

const routeIntegerSchema = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(0).max(Number.MAX_SAFE_INTEGER));
const resourceIdSchema = routeIntegerSchema.pipe(z.number().min(1));

export const keywordRouteSchema = z.object({
  keywordId: resourceIdSchema,
  page: z.number().int().min(1).max(500),
  mediaType: z.enum(['movie', 'tv']),
});

export const seasonRouteSchema = z.object({
  tvId: resourceIdSchema,
  seasonNumber: routeIntegerSchema,
});
