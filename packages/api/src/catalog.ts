import { DEFAULT_REGION, regionSchema } from '@movies/config/regions';
import { z } from 'zod';

import { mediaCardSchema } from './home';

export const catalogDetailInput = z.object({
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  type: z.enum(['movie', 'tv']),
  region: regionSchema.default(DEFAULT_REGION),
});
export type CatalogDetailInput = z.infer<typeof catalogDetailInput>;

const commonDetails = mediaCardSchema.extend({
  overview: z.string(),
  tagline: z.string(),
  genres: z.array(z.object({ id: z.number().int().positive(), name: z.string() })),
  voteCount: z.number().int().nonnegative(),
  popularity: z.number().nonnegative(),
  originalTitle: z.string(),
  status: z.string(),
  languages: z.array(z.string()),
  originCountries: z.array(z.string()),
  homepage: z.string().nullable(),
  certification: z.object({ value: z.string(), region: z.string() }).nullable(),
});

export const catalogDetailSchema = z.discriminatedUnion('type', [
  commonDetails.extend({
    type: z.literal('movie'),
    runtime: z.number().int().nonnegative().nullable(),
    budget: z.number().nonnegative(),
    revenue: z.number().nonnegative(),
  }),
  commonDetails.extend({
    type: z.literal('tv'),
    seasons: z.number().int().nonnegative(),
    episodes: z.number().int().nonnegative(),
    episodeRuntimes: z.array(z.number().int().nonnegative()),
    lastAirDate: z.string(),
    networks: z.array(z.string()),
  }),
]);
export type CatalogDetail = z.infer<typeof catalogDetailSchema>;

/** Route IDs are decimal positive integers, never coercible JS expressions. */
export function parseCatalogId(value: string | string[] | undefined) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  if (!Number.isSafeInteger(id)) return null;
  return id;
}
