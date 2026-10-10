import { DEFAULT_REGION, regionSchema } from '@movies/config/regions';
import { z } from 'zod';

import { MOVIE_SORT_OPTIONS, TV_SORT_OPTIONS } from './discover-options';
import { mediaCardSchema } from './home';

const selectionIds = z.array(z.number().int().positive().max(Number.MAX_SAFE_INTEGER)).max(50);
export const discoveryOptionsInput = z.object({
  type: z.enum(['movie', 'tv']).default('movie'),
  region: regionSchema.default(DEFAULT_REGION),
});
export const discoveryInput = discoveryOptionsInput
  .extend({
    page: z.number().int().min(1).max(500).default(1),
    genreIds: selectionIds.default([]),
    providerIds: selectionIds.default([]),
    originCountries: z
      .array(z.string().regex(/^[A-Z]{2}$/))
      .max(50)
      .default([]),
    sortBy: z.string().default('popularity.desc'),
    runtime: z.number().int().min(1).max(600).optional(),
  })
  .refine(
    function validSort(input) {
      const options = input.type === 'movie' ? MOVIE_SORT_OPTIONS : TV_SORT_OPTIONS;
      return options.some((option) => option.value === input.sortBy);
    },
    { message: 'Unsupported sort for this media type', path: ['sortBy'] },
  );

const choice = z.object({ id: z.number().int().positive(), name: z.string() });
export const discoveryOptionsSchema = z.object({
  genres: z.array(choice),
  providers: z.array(choice.extend({ logoUrl: z.string().url().nullable() })),
  countries: z.array(z.object({ code: z.string().regex(/^[A-Z]{2}$/), name: z.string() })),
});
export const discoveryPageSchema = z.object({
  items: z.array(mediaCardSchema),
  totalPages: z.number().int().min(0).max(500),
  totalResults: z.number().int().nonnegative(),
});
export type DiscoveryInput = z.infer<typeof discoveryInput>;
export type DiscoveryOptionsInput = z.infer<typeof discoveryOptionsInput>;
export type DiscoveryOptions = z.infer<typeof discoveryOptionsSchema>;
export type DiscoveryPage = z.infer<typeof discoveryPageSchema>;
