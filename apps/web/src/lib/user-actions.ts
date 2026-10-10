'use server';

import { randomUUID } from 'crypto';

import { WatchProvider } from '@movies/api/tmdb-types/watch-provider';
import { DEFAULT_REGION, regionSchema, type RegionCode } from '@movies/config/regions';
import { userWatchProviders } from '@movies/db/schema/user-watch-providers';
import { createUserPreferenceStore } from '@movies/db/user-preferences';
import { and, eq, inArray, not } from 'drizzle-orm';
import { cacheLife, cacheTag, revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth-server';
import { revalidateUserPreferenceCache } from '@/lib/cache-invalidation';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { db } from '@/lib/db';

import { MAJOR_STREAMING_PROVIDERS } from './config';
import { tmdbFetch } from './tmdb';

type WatchProvidersResponse = {
  results: WatchProvider[];
};

const MAX_DISPLAY_PRIORITY = 50;
const MAX_PROVIDERS = 12;
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

async function fetchWatchProvidersForRegion(region: string, userWatchProviders?: number[]) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.watchProvidersByRegion(region));
  cacheLife('days');

  const data = await tmdbFetch<WatchProvidersResponse>('/watch/providers/movie', {
    searchParams: { watch_region: region },
    errorMessage: 'Failed to fetch watch providers',
  });

  const availableProviders = data.results
    .filter((provider) => provider.display_priority <= MAX_DISPLAY_PRIORITY)
    .sort((a, b) => a.display_priority - b.display_priority);

  if (userWatchProviders && userWatchProviders.length > 0) {
    const filteredUserWatchProviders = availableProviders.filter((provider) =>
      userWatchProviders.includes(provider.provider_id),
    );

    return filteredUserWatchProviders;
  }

  const majorProviderIds = new Set<number>(MAJOR_STREAMING_PROVIDERS);
  const majorProviders = availableProviders.filter((provider) =>
    majorProviderIds.has(provider.provider_id),
  );

  const otherProviders = availableProviders.filter(
    (provider) => !majorProviderIds.has(provider.provider_id),
  );

  const topProviders = [...majorProviders, ...otherProviders].slice(0, MAX_PROVIDERS);

  return topProviders;
}

export async function getWatchProviders(region?: string, userWatchProviders?: number[]) {
  const userRegion = region || (await getUserRegion());
  return await fetchWatchProvidersForRegion(userRegion, userWatchProviders);
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

  const result = await db
    .select({ providerId: userWatchProviders.providerId })
    .from(userWatchProviders)
    .where(eq(userWatchProviders.userId, userId));

  return result.map((row) => row.providerId);
}

/**
 * Sets the watch providers preferred by the user
 */
export async function setUserWatchProviders(providerIds: number[]) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const uniqueIds = [...new Set(providerIds)];

  if (uniqueIds.length === 0) {
    await db.delete(userWatchProviders).where(eq(userWatchProviders.userId, session.user.id));
  } else {
    const values = uniqueIds.map((providerId) => ({
      id: randomUUID(),
      userId: session.user.id,
      providerId,
      createdAt: new Date(),
    }));

    await db.insert(userWatchProviders).values(values).onConflictDoNothing();
    await db
      .delete(userWatchProviders)
      .where(
        and(
          eq(userWatchProviders.userId, session.user.id),
          not(inArray(userWatchProviders.providerId, uniqueIds)),
        ),
      );
  }

  revalidateUserPreferenceCache(session.user.id);

  revalidatePath('/settings');
  revalidatePath('/discover');
}
