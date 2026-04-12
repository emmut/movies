import { invalidateCacheKey } from './server-cache';
import { CACHE_TAGS } from './cache-tags';

export function revalidateUserPreferenceCache(userId: string) {
  invalidateCacheKey(CACHE_TAGS.private.userRegion(userId));
  invalidateCacheKey(CACHE_TAGS.private.userWatchProviders(userId));
}

export function revalidateUserWatchlistCache(
  userId: string,
  resourceType: string,
  resourceId: number,
) {
  invalidateCacheKey(CACHE_TAGS.private.watchlistItem(userId, resourceType, resourceId));
  invalidateCacheKey(CACHE_TAGS.private.watchlistList(userId, resourceType));
  invalidateCacheKey(CACHE_TAGS.private.watchlistCount(userId, resourceType));
}

export function revalidateUserListCache(userId: string, listId?: string) {
  invalidateCacheKey(CACHE_TAGS.private.lists(userId));

  if (listId !== undefined) {
    invalidateCacheKey(CACHE_TAGS.private.listDetails(userId, listId));
  }
}

export function revalidateUserListStatusCache(
  userId: string,
  resourceType: string,
  resourceId: number,
) {
  invalidateCacheKey(CACHE_TAGS.private.listStatus(userId, resourceType, resourceId));
}
