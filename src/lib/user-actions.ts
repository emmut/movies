import { randomUUID } from 'crypto';

import { and, eq, inArray, not } from 'drizzle-orm';
import { createServerFn } from '@tanstack/react-start';

import { user } from '@/db/schema/auth';
import { userWatchProviders } from '@/db/schema/user-watch-providers';
import { env } from '@/env';
import { getSession } from '@/lib/auth-server';
import { revalidateUserPreferenceCache } from '@/lib/cache-invalidation';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { db } from '@/lib/db';
import { DEFAULT_REGION, isValidRegionCode, RegionCode, regionSchema } from '@/lib/regions';
import { WatchProvider } from '@/types/watch-provider';

import { MAJOR_STREAMING_PROVIDERS } from './config';
import { withCache, TTL } from './server-cache';

type WatchProvidersResponse = {
  results: WatchProvider[];
};

const MAX_DISPLAY_PRIORITY = 50;
const MAX_PROVIDERS = 12;

export async function getUserRegion() {
  const session = await getSession();

  if (!session?.user?.id) {
    return DEFAULT_REGION;
  }

  return await getCachedUserRegion(session.user.id);
}

const getCachedUserRegion = withCache(
  async (userId: string) => {
    const userData = await db
      .select({ region: user.region })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userData.length === 0) {
      throw new Error('User not found');
    }

    return (userData[0].region ?? DEFAULT_REGION) as RegionCode;
  },
  (userId) => CACHE_TAGS.private.userRegion(userId),
  TTL.minutes,
);

export const updateUserRegion = createServerFn()
  .inputValidator((data: string) => data)
  .handler(async ({ data: region }) => {
    const session = await getSession();

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const validatedRegion = regionSchema.parse(region);

    if (!isValidRegionCode(validatedRegion)) {
      throw new Error('Invalid region code');
    }

    await db
      .update(user)
      .set({
        region: validatedRegion,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    revalidateUserPreferenceCache(session.user.id);

    return { success: true, region: validatedRegion };
  });

const fetchWatchProvidersForRegion = withCache(
  async (region: string, _userWatchProviderIds?: number[]) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/watch/providers/movie?watch_region=${region}`,
      {
        headers: {
          authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
          accept: 'application/json',
        },
      },
    );

    if (!res.ok) {
      throw new Error('Failed to fetch watch providers');
    }

    const data: WatchProvidersResponse = await res.json();
    return data.results;
  },
  (region) => CACHE_TAGS.public.watchProvidersByRegion(region),
  TTL.days,
);

export async function getWatchProviders(region?: string, userWatchProviderIds?: number[]) {
  const userRegion = region || (await getUserRegion());
  const allProviders = await fetchWatchProvidersForRegion(userRegion);

  const availableProviders = allProviders
    .filter((provider) => provider.display_priority <= MAX_DISPLAY_PRIORITY)
    .sort((a, b) => a.display_priority - b.display_priority);

  if (userWatchProviderIds && userWatchProviderIds.length > 0) {
    return availableProviders.filter((provider) =>
      userWatchProviderIds.includes(provider.provider_id),
    );
  }

  const majorProviderIds = new Set<number>(MAJOR_STREAMING_PROVIDERS);
  const majorProviders = availableProviders.filter((provider) =>
    majorProviderIds.has(provider.provider_id),
  );
  const otherProviders = availableProviders.filter(
    (provider) => !majorProviderIds.has(provider.provider_id),
  );

  return [...majorProviders, ...otherProviders].slice(0, MAX_PROVIDERS);
}

export async function getAllWatchProviders(region?: string) {
  const userRegion = region || (await getUserRegion());
  return await fetchWatchProvidersForRegion(userRegion);
}

export async function getUserWatchProviders() {
  const session = await getSession();

  if (!session?.user?.id) {
    return [];
  }

  return await getCachedUserWatchProviders(session.user.id);
}

const getCachedUserWatchProviders = withCache(
  async (userId: string) => {
    const result = await db
      .select({ providerId: userWatchProviders.providerId })
      .from(userWatchProviders)
      .where(eq(userWatchProviders.userId, userId));

    return result.map((row) => row.providerId);
  },
  (userId) => CACHE_TAGS.private.userWatchProviders(userId),
  TTL.minutes,
);

export const setUserWatchProviders = createServerFn()
  .inputValidator((data: number[]) => data)
  .handler(async ({ data: providerIds }) => {
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
  });
