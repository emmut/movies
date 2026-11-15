import { revalidateTag } from 'next/cache';

import { CACHE_TAGS, SYSTEM_LIST_CACHE_TAGS } from './cache-tags';
import type { SystemListType } from './validations';

export function revalidateUserPreferenceCache(userId: string) {
  revalidateTag(CACHE_TAGS.private.userRegion(userId), { expire: 0 });
  revalidateTag(CACHE_TAGS.private.userWatchProviders(userId), { expire: 0 });
}

export function revalidateUserSystemListCache(
  userId: string,
  listType: SystemListType,
  resourceType: string,
  resourceId: number,
) {
  const tags = SYSTEM_LIST_CACHE_TAGS[listType];
  revalidateTag(tags.item(userId, resourceType, resourceId), { expire: 0 });
  revalidateTag(tags.list(userId, resourceType), { expire: 0 });
  revalidateTag(tags.count(userId, resourceType), { expire: 0 });
}

export function revalidateUserListCache(userId: string, listId?: string) {
  revalidateTag(CACHE_TAGS.private.lists(userId), { expire: 0 });

  if (listId !== undefined) {
    revalidateTag(CACHE_TAGS.private.listDetails(userId, listId), { expire: 0 });
  }
}

export function revalidateUserListStatusCache(
  userId: string,
  resourceType: string,
  resourceId: number,
) {
  revalidateTag(CACHE_TAGS.private.listStatus(userId, resourceType, resourceId), { expire: 0 });
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
    revalidateTag(tags.list(userId, resourceType), { expire: 0 });
    revalidateTag(tags.count(userId, resourceType), { expire: 0 });
  }
}
