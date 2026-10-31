import { z } from 'zod';

const routeIntegerSchema = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(0).max(Number.MAX_SAFE_INTEGER));
const resourceIdSchema = routeIntegerSchema.pipe(z.number().min(1));

export const seasonRouteSchema = z.object({
  tvId: resourceIdSchema,
  seasonNumber: routeIntegerSchema,
});
