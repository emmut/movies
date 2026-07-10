'use server';

import { and, count, desc, eq } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';

import { listItems, lists } from '@/db/schema/lists';
import { getUser } from '@/lib/auth-server';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { db } from '@/lib/db';
import { buildProxyImageUrls } from '@/lib/imgproxy-url';
import { getMovieDetails } from '@/lib/movies';
import { pageSchema, resourceIdSchema, resourceTypeSchema } from '@/lib/validations';
import { WATCHLIST_LIST_TYPE } from '@/lib/watchlist-list';
import { MovieDetails } from '@/types/movie';
import type { ProxyImageUrls } from '@/types/proxy-image';
import { TvDetails } from '@/types/tv-show';

import { ITEMS_PER_PAGE } from './config';
import { getTvShowDetails } from './tv-shows';

type ResourceDetailsWithImage = (MovieDetails | TvDetails) & {
  posterImageUrls?: ProxyImageUrls;
};

/**
 * Filters list_items joined with lists down to the user's watchlist system
 * list. Use with a `listItems` innerJoin on `lists`.
 */
function watchlistItemsFilter(userId: string) {
  return and(eq(lists.userId, userId), eq(lists.type, WATCHLIST_LIST_TYPE));
}

/**
 * Checks if a specific resource is present in the authenticated user's watchlist.
 *
 * @param resourceId - The unique identifier of the resource to check.
 * @param resourceType - The type of resource (e.g., 'movie', 'tv').
 * @returns `true` if the resource is in the user's watchlist; otherwise, `false`.
 */
export async function isResourceInWatchlist(resourceId: number, resourceType: string) {
  const user = await getUser();
  if (!user) {
    return false;
  }

  return await getCachedWatchlistMembership(user.id, resourceId, resourceType);
}

async function getCachedWatchlistMembership(
  userId: string,
  resourceId: number,
  resourceType: string,
) {
  'use cache: private';
  cacheTag(CACHE_TAGS.private.watchlistItem(userId, resourceType, resourceId));
  cacheTag(CACHE_TAGS.private.watchlistList(userId, resourceType));
  cacheLife('privateShort');

  try {
    const validatedResourceId = resourceIdSchema.parse({
      resourceId,
      resourceType,
    });

    const result = await db
      .select({ id: listItems.id })
      .from(listItems)
      .innerJoin(lists, eq(listItems.listId, lists.id))
      .where(
        and(
          watchlistItemsFilter(userId),
          eq(listItems.resourceId, validatedResourceId.resourceId),
          eq(listItems.resourceType, validatedResourceId.resourceType),
        ),
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
}

/**
 * Retrieves a paginated list of the authenticated user's watchlist entries of a specified resource type, each augmented with detailed information.
 *
 * @param resourceType - The type of resource to include ('movie' or 'tv').
 * @param page - The page number (1-based).
 * @param itemsPerPage - The number of items per page.
 * @returns An object containing the paginated watchlist items and pagination metadata.
 */
export async function getWatchlistWithResourceDetailsPaginated(
  resourceType: 'movie' | 'tv',
  page: number = 1,
) {
  if (!resourceTypeSchema.safeParse(resourceType).success || !pageSchema.safeParse(page).success) {
    throw new Error('Invalid resource type or page number');
  }

  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const totalCountResult = await db
      .select({ count: count() })
      .from(listItems)
      .innerJoin(lists, eq(listItems.listId, lists.id))
      .where(and(watchlistItemsFilter(user.id), eq(listItems.resourceType, resourceType)));

    const totalItems = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (totalItems === 0) {
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        itemsPerPage: ITEMS_PER_PAGE,
      };
    }

    const offset = (page - 1) * ITEMS_PER_PAGE;
    const paginatedWatchlist = await db
      .select({
        id: listItems.id,
        resourceId: listItems.resourceId,
        resourceType: listItems.resourceType,
        createdAt: listItems.createdAt,
      })
      .from(listItems)
      .innerJoin(lists, eq(listItems.listId, lists.id))
      .where(and(watchlistItemsFilter(user.id), eq(listItems.resourceType, resourceType)))
      .orderBy(desc(listItems.createdAt))
      .limit(ITEMS_PER_PAGE)
      .offset(offset);

    const resourcesWithDetails = await Promise.allSettled(
      paginatedWatchlist.map(async (item) => {
        let resourceDetails: ResourceDetailsWithImage | null = null;
        if (resourceType === 'movie') {
          const movieDetails = await getMovieDetails(item.resourceId);
          resourceDetails = {
            ...movieDetails,
            posterImageUrls: buildProxyImageUrls(movieDetails.poster_path, {
              width: 500,
              fill: true,
            }),
          };
        } else if (resourceType === 'tv') {
          const tvDetails = await getTvShowDetails(item.resourceId);
          resourceDetails = {
            ...tvDetails,
            posterImageUrls: buildProxyImageUrls(tvDetails.poster_path, {
              width: 500,
              fill: true,
            }),
          };
        }

        if (!resourceDetails) {
          return null;
        }

        return {
          ...item,
          resource: resourceDetails,
        };
      }),
    );

    const items = resourcesWithDetails
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value)
      .filter((item) => item !== null);

    return {
      items,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  } catch (error) {
    console.error('Error fetching paginated watchlist:', error);
    return {
      items: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: page,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  }
}

/**
 * Gets the total count of watchlist items for a specific resource type.
 *
 * @param resourceType - The type of resource to count ('movie' or 'tv').
 * @returns The total number of items in the watchlist for the specified resource type.
 */
export async function getWatchlistCount(resourceType: string) {
  const user = await getUser();
  if (!user) {
    return 0;
  }

  return await getCachedWatchlistCount(user.id, resourceType);
}

async function getCachedWatchlistCount(userId: string, resourceType: string) {
  'use cache: private';
  cacheTag(CACHE_TAGS.private.watchlistCount(userId, resourceType));
  cacheTag(CACHE_TAGS.private.watchlistList(userId, resourceType));
  cacheLife('privateShort');

  try {
    const result = await db
      .select({ count: count() })
      .from(listItems)
      .innerJoin(lists, eq(listItems.listId, lists.id))
      .where(and(watchlistItemsFilter(userId), eq(listItems.resourceType, resourceType)));

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error counting watchlist items:', error);
    return 0;
  }
}
