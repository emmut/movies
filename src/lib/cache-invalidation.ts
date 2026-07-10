import { revalidateTag } from 'next/cache';

import type { SystemListType } from './validations';

import { CACHE_TAGS, SYSTEM_LIST_CACHE_TAGS } from './cache-tags';

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
