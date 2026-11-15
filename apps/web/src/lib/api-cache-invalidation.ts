import 'server-only';
import type { MutationEvent } from '@movies/api/mutation-effects';
import { revalidatePath } from 'next/cache';

import {
  revalidateUserPreferenceCache,
  revalidateUserListCache,
  revalidateUserListStatusCache,
  revalidateUserSystemListCache,
  revalidateUserSystemListPageCache,
} from '@/lib/cache-invalidation';

/** Next's server render cache and React Query are separate cache layers. */
export function invalidateApiMutation(event: MutationEvent) {
  switch (event.domain) {
    case 'preferences':
      invalidatePreferences(event.userId);
      break;
    case 'customLists':
      invalidateCustomList(event);
      break;
    case 'systemLists':
      invalidateSystemList(event);
      break;
  }
}

function invalidatePreferences(userId: string) {
  revalidateUserPreferenceCache(userId);
  for (const page of ['/', '/settings', '/discover']) {
    revalidatePath(page);
  }
}

function invalidateCustomList({
  userId,
  listId,
  resource,
}: Extract<MutationEvent, { domain: 'customLists' }>) {
  revalidateUserListCache(userId, listId);
  if (resource) {
    revalidateUserListStatusCache(userId, resource.resourceType, resource.resourceId);
  }
  revalidatePath('/lists');
  revalidatePath('/lists/[id]', 'page');
}

function invalidateSystemList({
  userId,
  listType,
  resource,
}: Extract<MutationEvent, { domain: 'systemLists' }>) {
  revalidateUserSystemListPageCache(userId, listType);
  if (resource) {
    revalidateUserSystemListCache(userId, listType, resource.resourceType, resource.resourceId);
    revalidatePath(`/${resource.resourceType}/${resource.resourceId}`);
  }
  revalidatePath(`/${listType}`);
}
