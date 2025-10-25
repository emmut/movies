'use server';

import { user } from '@/db/schema/auth';
import { userWatchProviders } from '@/db/schema/user-watch-providers';
import { env } from '@/env';
import { getSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import {
  DEFAULT_REGION,
  isValidRegionCode,
  RegionCode,
  regionSchema,
} from '@/lib/regions';
import { WatchProvider } from '@/types/watch-provider';
import { randomUUID } from 'crypto';
import { and, eq, inArray, not } from 'drizzle-orm';
import {
  cacheLife,
  cacheTag,
  revalidatePath,
} from 'next/cache';
import { MAJOR_STREAMING_PROVIDERS } from './config';

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

  const userData = await db
    .select({ region: user.region })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (userData.length === 0) {
    throw new Error('User not found');
  }

  return (userData[0].region ?? DEFAULT_REGION) as RegionCode;
}

export async function updateUserRegion(region: string) {
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

  revalidatePath('/settings');
  revalidatePath('/discover');
  revalidatePath('/');

  return { success: true, region: validatedRegion };
}

async function fetchWatchProvidersForRegion(
  region: string,
  userWatchProviders?: number[]
) {
  'use cache';
  cacheTag('watch-providers');
  cacheLife('days');

  const res = await fetch(
    `https://api.themoviedb.org/3/watch/providers/movie?watch_region=${region}`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch watch providers');
  }

  const data: WatchProvidersResponse = await res.json();

  const availableProviders = data.results
    .filter((provider) => provider.display_priority <= MAX_DISPLAY_PRIORITY)
    .sort((a, b) => a.display_priority - b.display_priority);

  if (userWatchProviders && userWatchProviders.length > 0) {
    const filteredUserWatchProviders = availableProviders.filter((provider) =>
      userWatchProviders.includes(provider.provider_id)
    );

    return filteredUserWatchProviders;
  }

  const majorProviderIds = new Set<number>(MAJOR_STREAMING_PROVIDERS);
  const majorProviders = availableProviders.filter((provider) =>
    majorProviderIds.has(provider.provider_id)
  );

  const otherProviders = availableProviders.filter(
    (provider) => !majorProviderIds.has(provider.provider_id)
  );

  const topProviders = [...majorProviders, ...otherProviders].slice(
    0,
    MAX_PROVIDERS
  );

  return topProviders;
}

export async function getWatchProviders(
  region?: string,
  userWatchProviders?: number[]
) {
  const userRegion = region || (await getUserRegion());
  return await fetchWatchProvidersForRegion(userRegion, userWatchProviders);
}

async function fetchAllWatchProvidersForRegion(region: string) {
  'use cache';
  cacheTag('watch-providers');
  cacheLife('days');

  const res = await fetch(
    `https://api.themoviedb.org/3/watch/providers/movie?watch_region=${region}`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch watch providers');
  }

  const data: WatchProvidersResponse = await res.json();

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

  const result = await db
    .select({ providerId: userWatchProviders.providerId })
    .from(userWatchProviders)
    .where(eq(userWatchProviders.userId, session.user.id));

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
    await db
      .delete(userWatchProviders)
      .where(eq(userWatchProviders.userId, session.user.id));
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
          not(inArray(userWatchProviders.providerId, uniqueIds))
        )
      );
  }

  revalidatePath('/settings');
  revalidatePath('/discover');
}
