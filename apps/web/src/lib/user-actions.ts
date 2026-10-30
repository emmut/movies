'use server';

import 'server-only';
import { providerPreferenceSchema, selectWatchProviders } from '@movies/api/preferences';
import { WatchProvider } from '@movies/api/tmdb-types/watch-provider';
import { DEFAULT_REGION, regionSchema, type RegionCode } from '@movies/config/regions';
import { createUserPreferenceStore } from '@movies/db/user-preferences';
import { cacheLife, cacheTag, revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth-server';
import { revalidateUserPreferenceCache } from '@/lib/cache-invalidation';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { db } from '@/lib/db';

import { tmdbFetch } from './tmdb';

type WatchProvidersResponse = {
  results: WatchProvider[];
};

const preferences = createUserPreferenceStore(db);

export async function getUserRegion() {
  const session = await getSession();

  if (!session?.user?.id) {
    return DEFAULT_REGION;
  }

  return await getCachedUserRegion(session.user.id);
}

async function getCachedUserRegion(userId: string) {
  'use cache: private';
  cacheTag(CACHE_TAGS.private.userRegion(userId));
  cacheLife('privateShort');

  return preferences.readRegion(userId);
}

export async function updateUserRegion(region: string) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validatedRegion = regionSchema.parse(region) as RegionCode;

  await preferences.writeRegion(session.user.id, validatedRegion);

  revalidateUserPreferenceCache(session.user.id);

  revalidatePath('/settings');
  revalidatePath('/discover');
  revalidatePath('/');

  return { success: true, region: validatedRegion };
}

export async function getWatchProviders(region?: string, userWatchProviders?: number[]) {
  const userRegion = region || (await getUserRegion());
  const providers = await fetchAllWatchProvidersForRegion(userRegion);
  return selectWatchProviders(providers, userWatchProviders);
}

async function fetchAllWatchProvidersForRegion(region: string) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.watchProvidersByRegion(region));
  cacheLife('days');

  const data = await tmdbFetch<WatchProvidersResponse>('/watch/providers/movie', {
    searchParams: { watch_region: region },
    errorMessage: 'Failed to fetch watch providers',
  });

  return data.results;
}

export async function getAllWatchProviders(region?: string) {
  const userRegion = region || (await getUserRegion());
  return await fetchAllWatchProvidersForRegion(userRegion);
}

/**
 * Gets the watch providers preferred by the user
 */
export async function getUserWatchProviders() {
  const session = await getSession();

  if (!session?.user?.id) {
    return [];
  }

  return await getCachedUserWatchProviders(session.user.id);
}

async function getCachedUserWatchProviders(userId: string) {
  'use cache: private';
  cacheTag(CACHE_TAGS.private.userWatchProviders(userId));
  cacheLife('privateShort');

  return preferences.readProviders(userId);
}

/**
 * Sets the watch providers preferred by the user
 */
export async function setUserWatchProviders(providerIds: number[]) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validated = providerPreferenceSchema.parse({ providerIds });
  await preferences.writeProviders(session.user.id, validated.providerIds);

  revalidateUserPreferenceCache(session.user.id);

  revalidatePath('/settings');
  revalidatePath('/discover');
}
