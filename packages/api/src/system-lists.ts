import { ITEMS_PER_PAGE } from '@movies/config/constants';
import { DEFAULT_REGION } from '@movies/config/regions';
import { z } from 'zod';

import { mediaCardSchema } from './home';
import { watchProviderIdSchema, regionPreferenceSchema } from './preferences';
import { resourceIdSchema, systemListTypeSchema, watchProviderFilterSchema } from './validations';

export const systemListResourceInput = resourceIdSchema.extend({
  resourceId: z.number().int().positive().max(2_147_483_647),
});
export const systemListToggleInput = systemListResourceInput.extend({
  listType: systemListTypeSchema,
});
export const systemListPageInput = z.object({
  listType: systemListTypeSchema,
  resourceType: z.enum(['movie', 'tv']).default('movie'),
  page: z.number().int().min(1).default(1),
  providerIds: z.array(watchProviderIdSchema).default([]),
  region: regionPreferenceSchema.shape.region.default(DEFAULT_REGION),
});
export const systemListMoveInput = z.object({
  listType: systemListTypeSchema,
  resourceType: z.enum(['movie', 'tv']),
  itemId: z.uuid(),
  position: z.number().int().min(0),
});
export const systemListMembershipSchema = z.object({
  inWatchlist: z.boolean(),
  watched: z.boolean(),
});
export const systemListToggleSchema = z.object({
  action: z.enum(['added', 'removed', 'unchanged']),
});
export const systemListPageSchema = z.object({
  items: z.array(mediaCardSchema.extend({ listItemId: z.uuid() })),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  currentPage: z.number().int().positive(),
  itemsPerPage: z.literal(ITEMS_PER_PAGE),
  counts: z.object({ movie: z.number().int().nonnegative(), tv: z.number().int().nonnegative() }),
  unavailableItems: z.number().int().nonnegative(),
});
export type SystemListPageInput = z.infer<typeof systemListPageInput>;
export type SystemListPage = z.infer<typeof systemListPageSchema>;
export type SystemListToggleInput = z.infer<typeof systemListToggleInput>;
export type SystemListResourceInput = z.infer<typeof systemListResourceInput>;
export type SystemListMoveInput = z.infer<typeof systemListMoveInput>;
export type SystemListMembership = z.infer<typeof systemListMembershipSchema>;

/** Inactive filters ignore region; active provider filters use the supported region set. */
export function parseWatchProviderFilter(providerIds?: number[], region?: string) {
  if (!providerIds || providerIds.length === 0) {
    return null;
  }
  return watchProviderFilterSchema.parse({ providerIds, region: region ?? DEFAULT_REGION });
}
