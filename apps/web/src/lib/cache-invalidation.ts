import { revalidateTag } from 'next/cache';

import { CACHE_TAGS, SYSTEM_LIST_CACHE_TAGS } from './cache-tags';
import type { SystemListType } from './validations';

export function revalidateUserPreferenceCache(userId: string) {
  revalidateTag(CACHE_TAGS.private.userRegion(userId), 'max');
  revalidateTag(CACHE_TAGS.private.userWatchProviders(userId), 'max');
}

export function revalidateUserSystemListCache(
  userId: string,
  listType: SystemListType,
  resourceType: string,
  resourceId: number,
) {
  const tags = SYSTEM_LIST_CACHE_TAGS[listType];
  revalidateTag(tags.item(userId, resourceType, resourceId), 'max');
  revalidateTag(tags.list(userId, resourceType), 'max');
  revalidateTag(tags.count(userId, resourceType), 'max');
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

/**
 * Revalidates the per-media-type list and count tags for a system list
 * (watchlist, watched) so the list page re-renders after a reorder. The item
 * membership tag is intentionally left alone — reordering never changes
 * membership, so detail-page buttons stay valid.
 */
export function revalidateUserSystemListPageCache(userId: string, listType: SystemListType) {
  const tags = SYSTEM_LIST_CACHE_TAGS[listType];
  for (const resourceType of ['movie', 'tv'] as const) {
    revalidateTag(tags.list(userId, resourceType), 'max');
    revalidateTag(tags.count(userId, resourceType), 'max');
  }
}
