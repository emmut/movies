'use server';

import { cacheLife, cacheTag } from 'next/cache';

import { watchlist } from '@/db/schema/watchlist';
import { getUser } from '@/lib/auth-server';
import { CACHE_TAGS } from '@/lib/cache-tags';
import {
  countCollectionRows,
  getAuthedCollectionPage,
  hasCollectionRow,
} from '@/lib/resource-collection';
import { resourceIdSchema } from '@/lib/validations';

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
    const validated = resourceIdSchema.parse({ resourceId, resourceType });
    return await hasCollectionRow(watchlist, userId, validated.resourceId, validated.resourceType);
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
 * @returns An object containing the paginated watchlist items and pagination metadata.
 */
export async function getWatchlistWithResourceDetailsPaginated(
  resourceType: 'movie' | 'tv',
  page: number = 1,
) {
  return await getAuthedCollectionPage(watchlist, resourceType, page, 'watchlist');
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
    return await countCollectionRows(watchlist, userId, resourceType);
  } catch (error) {
    console.error('Error counting watchlist items:', error);
    return 0;
  }
}
