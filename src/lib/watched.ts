'use server';

import { cacheLife, cacheTag } from 'next/cache';

import { watched } from '@/db/schema/watched';
import { getUser } from '@/lib/auth-server';
import { CACHE_TAGS } from '@/lib/cache-tags';
import {
  countCollectionRows,
  getAuthedCollectionPage,
  hasCollectionRow,
} from '@/lib/resource-collection';
import { resourceIdSchema } from '@/lib/validations';

/**
 * Checks if a specific resource is in the authenticated user's watched history.
 *
 * @param resourceId - The unique identifier of the resource to check.
 * @param resourceType - The type of resource (e.g., 'movie', 'tv').
 * @returns `true` if the resource is marked as watched; otherwise, `false`.
 */
export async function isResourceWatched(resourceId: number, resourceType: string) {
  const user = await getUser();
  if (!user) {
    return false;
  }

  return await getCachedWatchedMembership(user.id, resourceId, resourceType);
}

async function getCachedWatchedMembership(
  userId: string,
  resourceId: number,
  resourceType: string,
) {
  'use cache: private';
  cacheTag(CACHE_TAGS.private.watchedItem(userId, resourceType, resourceId));
  cacheTag(CACHE_TAGS.private.watchedList(userId, resourceType));
  cacheLife('privateShort');

  try {
    const validated = resourceIdSchema.parse({ resourceId, resourceType });
    return await hasCollectionRow(watched, userId, validated.resourceId, validated.resourceType);
  } catch (error) {
    console.error('Error checking watched history:', error);
    return false;
  }
}

/**
 * Retrieves a paginated list of the authenticated user's watched entries of a specified resource type, each augmented with detailed information. Most recently watched first.
 *
 * @param resourceType - The type of resource to include ('movie' or 'tv').
 * @param page - The page number (1-based).
 * @returns An object containing the paginated watched items and pagination metadata.
 */
export async function getWatchedWithResourceDetailsPaginated(
  resourceType: 'movie' | 'tv',
  page: number = 1,
) {
  return await getAuthedCollectionPage(watched, resourceType, page, 'watched history');
}

/**
 * Gets the total count of watched items for a specific resource type.
 *
 * @param resourceType - The type of resource to count ('movie' or 'tv').
 * @returns The total number of watched items for the specified resource type.
 */
export async function getWatchedCount(resourceType: string) {
  const user = await getUser();
  if (!user) {
    return 0;
  }

  return await getCachedWatchedCount(user.id, resourceType);
}

async function getCachedWatchedCount(userId: string, resourceType: string) {
  'use cache: private';
  cacheTag(CACHE_TAGS.private.watchedCount(userId, resourceType));
  cacheTag(CACHE_TAGS.private.watchedList(userId, resourceType));
  cacheLife('privateShort');

  try {
    return await countCollectionRows(watched, userId, resourceType);
  } catch (error) {
    console.error('Error counting watched items:', error);
    return 0;
  }
}
