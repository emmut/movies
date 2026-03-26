import { revalidateTag } from 'next/cache';

import { CACHE_TAGS } from './cache-tags';

export function revalidateUserPreferenceCache(userId: string) {
  revalidateTag(CACHE_TAGS.private.userRegion(userId), 'max');
  revalidateTag(CACHE_TAGS.private.userWatchProviders(userId), 'max');
}

export function revalidateUserWatchlistCache(
  userId: string,
  resourceType: string,
  resourceId: number,
) {
  revalidateTag(CACHE_TAGS.private.watchlistItem(userId, resourceType, resourceId), 'max');
  revalidateTag(CACHE_TAGS.private.watchlistList(userId, resourceType), 'max');
  revalidateTag(CACHE_TAGS.private.watchlistCount(userId, resourceType), 'max');
}

export function revalidateUserListCache(userId: string, listId?: string) {
  revalidateTag(CACHE_TAGS.private.lists(userId), 'max');

  if (listId !== undefined) {
    revalidateTag(CACHE_TAGS.private.listDetails(userId, listId), 'max');
  }
}

export function revalidateUserListStatusCache(
  userId: string,
  resourceType: string,
  resourceId: number,
) {
  revalidateTag(CACHE_TAGS.private.listStatus(userId, resourceType, resourceId), 'max');
}
