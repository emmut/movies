import { MAJOR_STREAMING_PROVIDERS } from '@movies/config/constants';
import { regions, type RegionCode } from '@movies/config/regions';
import { z } from 'zod';

const regionCodes = regions.map((region) => region.code) as [RegionCode, ...RegionCode[]];

/** The signed-in account's region; the same supported set and default as web settings. */
export const regionPreferenceSchema = z.object({ region: z.enum(regionCodes) });
export type RegionPreference = z.infer<typeof regionPreferenceSchema>;

const POSTGRES_INTEGER_MAX = 2_147_483_647;
// Highest TMDB display priority still offered as a filter choice.
const MAX_PROVIDER_DISPLAY_PRIORITY = 50;
// Choices shown when the account has not saved any providers.
const DEFAULT_PROVIDER_CHOICE_LIMIT = 12;

/** A positive id that fits PostgreSQL's integer column. */
export const postgresIntegerIdSchema = z.number().int().positive().max(POSTGRES_INTEGER_MAX);

// Stored in PostgreSQL's integer column; validate both consumers before writing.
export const watchProviderIdSchema = postgresIntegerIdSchema;
export const providerPreferenceSchema = z.object({
  providerIds: z
    .array(watchProviderIdSchema)
    .transform((ids) => [...new Set(ids)].sort((a, b) => a - b)),
});
export type ProviderPreference = z.infer<typeof providerPreferenceSchema>;

export const providerChoicesSchema = z.array(
  z.object({
    id: watchProviderIdSchema,
    name: z.string(),
    logoUrl: z.string().url().nullable(),
  }),
);
export type ProviderChoice = z.infer<typeof providerChoicesSchema>[number];

/** Empty URL filters fall back to the saved account selection, as on web. */
export function resolveWatchProviderIds(urlProviders: number[], userProviders: number[]): number[] {
  if (urlProviders.length > 0) {
    return urlProviders;
  }
  return userProviders;
}

export function getWatchProvidersString(urlProviders: number[], userProviders: number[]) {
  const ids = resolveWatchProviderIds(urlProviders, userProviders);
  if (ids.length === 0) {
    return undefined;
  }
  return ids.join('|');
}

/** The provider choices shown by list filters: supported priorities, saved choices or major services. */
export function selectWatchProviders<T extends { provider_id: number; display_priority: number }>(
  records: T[],
  userProviders: number[] = [],
): T[] {
  const available = records
    .filter((item) => item.display_priority <= MAX_PROVIDER_DISPLAY_PRIORITY)
    .sort((a, b) => a.display_priority - b.display_priority);
  if (userProviders.length > 0) {
    return available.filter((item) => userProviders.includes(item.provider_id));
  }
  const major = new Set<number>(MAJOR_STREAMING_PROVIDERS);
  const preferred = available.filter((item) => major.has(item.provider_id));
  const other = available.filter((item) => !major.has(item.provider_id));
  return [...preferred, ...other].slice(0, DEFAULT_PROVIDER_CHOICE_LIMIT);
}
