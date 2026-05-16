import { buildProxyImageUrls } from "@movies/media/imgproxy-url";
import { db } from "@movies/db";
import { watchlist } from "@movies/db/schema/watchlist";
import { and, count, eq } from "drizzle-orm";

import { ITEMS_PER_PAGE } from "./config";
import { getMovieDetails } from "./movies";
import { getTvShowDetails } from "./tv-shows";
import { resourceIdSchema, resourceTypeSchema, pageSchema } from "./validations";
import type { MovieDetails } from "../types/movie";
import type { ProxyImageUrls } from "../types/proxy-image";
import type { TvDetails } from "../types/tv-show";

type ResourceDetailsWithImage = (MovieDetails | TvDetails) & {
  posterImageUrls?: ProxyImageUrls;
};

export async function getUserWatchlist(userId: string | null | undefined) {
  if (!userId) return [];
  try {
    return await db.select().from(watchlist).where(eq(watchlist.userId, userId));
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return [];
  }
}

export async function isResourceInWatchlist(
  userId: string | null | undefined,
  resourceId: number,
  resourceType: string,
) {
  if (!userId) return false;
  try {
    const parsed = resourceIdSchema.parse({ resourceId, resourceType });
    const result = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.resourceId, parsed.resourceId),
          eq(watchlist.resourceType, parsed.resourceType),
        ),
      );
    return result.length > 0;
  } catch (error) {
    console.error("Error checking watchlist:", error);
    return false;
  }
}

export async function getWatchlistWithResourceDetailsPaginated(
  userId: string,
  resourceType: "movie" | "tv",
  page: number = 1,
) {
  if (!resourceTypeSchema.safeParse(resourceType).success || !pageSchema.safeParse(page).success) {
    throw new Error("Invalid resource type or page number");
  }

  const totalCountResult = await db
    .select({ count: count() })
    .from(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.resourceType, resourceType)));

  const totalItems = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (totalItems === 0) {
    return { items: [], totalItems: 0, totalPages: 0, currentPage: page, itemsPerPage: ITEMS_PER_PAGE };
  }

  const offset = (page - 1) * ITEMS_PER_PAGE;
  const rows = await db
    .select()
    .from(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.resourceType, resourceType)))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  const settled = await Promise.allSettled(
    rows.map(async (item) => {
      let resource: ResourceDetailsWithImage | null = null;
      if (resourceType === "movie") {
        const m = await getMovieDetails(item.resourceId);
        resource = { ...m, posterImageUrls: buildProxyImageUrls(m.poster_path, { width: 500, fill: true }) };
      } else {
        const t = await getTvShowDetails(item.resourceId);
        resource = { ...t, posterImageUrls: buildProxyImageUrls(t.poster_path, { width: 500, fill: true }) };
      }
      return { ...item, resource };
    }),
  );

  const items = settled
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<{ resource: ResourceDetailsWithImage }>).value);

  return { items, totalItems, totalPages, currentPage: page, itemsPerPage: ITEMS_PER_PAGE };
}

export async function getWatchlistCount(userId: string | null | undefined, resourceType: string) {
  if (!userId) return 0;
  try {
    const result = await db
      .select({ count: count() })
      .from(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.resourceType, resourceType)));
    return result[0]?.count || 0;
  } catch (error) {
    console.error("Error counting watchlist:", error);
    return 0;
  }
}

export async function addToWatchlist(userId: string, resourceId: number, resourceType: string) {
  const parsed = resourceIdSchema.parse({ resourceId, resourceType });
  const existing = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.userId, userId),
        eq(watchlist.resourceId, parsed.resourceId),
        eq(watchlist.resourceType, parsed.resourceType),
      ),
    );
  if (existing.length > 0) throw new Error("Already in watchlist");

  await db.insert(watchlist).values({
    id: crypto.randomUUID(),
    userId,
    resourceId: parsed.resourceId,
    resourceType: parsed.resourceType,
  });
  return { success: true };
}

export async function removeFromWatchlist(userId: string, resourceId: number, resourceType: string) {
  const parsed = resourceIdSchema.parse({ resourceId, resourceType });
  await db
    .delete(watchlist)
    .where(
      and(
        eq(watchlist.userId, userId),
        eq(watchlist.resourceId, parsed.resourceId),
        eq(watchlist.resourceType, parsed.resourceType),
      ),
    );
  return { success: true };
}

export async function toggleWatchlist(userId: string, resourceId: number, resourceType: string) {
  const parsed = resourceIdSchema.parse({ resourceId, resourceType });
  const existing = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.userId, userId),
        eq(watchlist.resourceId, parsed.resourceId),
        eq(watchlist.resourceType, parsed.resourceType),
      ),
    );

  if (existing.length > 0) {
    await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.resourceId, parsed.resourceId),
          eq(watchlist.resourceType, parsed.resourceType),
        ),
      );
    return { success: true, action: "removed" as const };
  }

  await db.insert(watchlist).values({
    id: crypto.randomUUID(),
    userId,
    resourceId: parsed.resourceId,
    resourceType: parsed.resourceType,
  });
  return { success: true, action: "added" as const };
}
