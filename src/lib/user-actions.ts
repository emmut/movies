'use server';

import { user } from '@/db/schema';
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
import { eq } from 'drizzle-orm';
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
  revalidatePath,
} from 'next/cache';
import { MAJOR_STREAMING_PROVIDERS } from './config';

type WatchProvidersResponse = {
  results: WatchProvider[];
};

const MAX_DISPLAY_PRIORITY = 20;
const MAX_PROVIDERS = 11;

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

async function fetchWatchProvidersForRegion(region: string) {
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

export async function getWatchProviders(region?: string) {
  const userRegion = region || (await getUserRegion());
  return await fetchWatchProvidersForRegion(userRegion);
}
