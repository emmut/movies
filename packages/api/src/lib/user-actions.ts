import { randomUUID } from "crypto";

import { db } from "@movies/db";
import { user } from "@movies/db/schema/auth";
import { userWatchProviders } from "@movies/db/schema/user-watch-providers";
import { env } from "@movies/env/server";
import { and, eq, inArray, not } from "drizzle-orm";

import { MAJOR_STREAMING_PROVIDERS } from "./config";
import { DEFAULT_REGION, isValidRegionCode, RegionCode, regionSchema } from "./regions";
import type { WatchProvider } from "../types/watch-provider";

type WatchProvidersResponse = { results: WatchProvider[] };

const MAX_DISPLAY_PRIORITY = 50;
const MAX_PROVIDERS = 12;

export async function getUserRegion(userId?: string | null): Promise<RegionCode> {
  if (!userId) return DEFAULT_REGION;

  const rows = await db
    .select({ region: user.region })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (rows.length === 0) return DEFAULT_REGION;
  return (rows[0].region ?? DEFAULT_REGION) as RegionCode;
}

export async function updateUserRegion(userId: string, region: string) {
  const validated = regionSchema.parse(region);
  if (!isValidRegionCode(validated)) throw new Error("Invalid region code");

  await db
    .update(user)
    .set({ region: validated, updatedAt: new Date() })
    .where(eq(user.id, userId));

  return { success: true, region: validated };
}

async function fetchWatchProvidersForRegion(region: string, userWatchProvidersList?: number[]) {
  const res = await fetch(
    `https://api.themoviedb.org/3/watch/providers/movie?watch_region=${region}`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: "application/json",
      },
    },
  );

  if (!res.ok) throw new Error("Failed to fetch watch providers");

  const data: WatchProvidersResponse = await res.json();

  const available = data.results
    .filter((p) => p.display_priority <= MAX_DISPLAY_PRIORITY)
    .sort((a, b) => a.display_priority - b.display_priority);

  if (userWatchProvidersList && userWatchProvidersList.length > 0) {
    return available.filter((p) => userWatchProvidersList.includes(p.provider_id));
  }

  const majorIds = new Set<number>(MAJOR_STREAMING_PROVIDERS);
  const major = available.filter((p) => majorIds.has(p.provider_id));
  const others = available.filter((p) => !majorIds.has(p.provider_id));
  return [...major, ...others].slice(0, MAX_PROVIDERS);
}

export async function getWatchProviders(region?: string, userWatchProvidersList?: number[]) {
  return await fetchWatchProvidersForRegion(region ?? DEFAULT_REGION, userWatchProvidersList);
}

export async function getAllWatchProviders(region?: string) {
  const r = region ?? DEFAULT_REGION;
  const res = await fetch(
    `https://api.themoviedb.org/3/watch/providers/movie?watch_region=${r}`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: "application/json",
      },
    },
  );
  if (!res.ok) throw new Error("Failed to fetch watch providers");
  const data: WatchProvidersResponse = await res.json();
  return data.results;
}

export async function getUserWatchProviders(userId: string | null | undefined): Promise<number[]> {
  if (!userId) return [];
  const rows = await db
    .select({ providerId: userWatchProviders.providerId })
    .from(userWatchProviders)
    .where(eq(userWatchProviders.userId, userId));
  return rows.map((r) => r.providerId);
}

export async function setUserWatchProviders(userId: string, providerIds: number[]) {
  const uniqueIds = [...new Set(providerIds)];

  if (uniqueIds.length === 0) {
    await db.delete(userWatchProviders).where(eq(userWatchProviders.userId, userId));
    return { success: true };
  }

  const values = uniqueIds.map((providerId) => ({
    id: randomUUID(),
    userId,
    providerId,
    createdAt: new Date(),
  }));

  await db.insert(userWatchProviders).values(values).onConflictDoNothing();
  await db
    .delete(userWatchProviders)
    .where(
      and(
        eq(userWatchProviders.userId, userId),
        not(inArray(userWatchProviders.providerId, uniqueIds)),
      ),
    );

  return { success: true };
}
