import 'server-only';
import { customListResourceInput } from '@movies/api/custom-lists';
import type { AppContext } from '@movies/api/router';
import { systemListResourceInput } from '@movies/api/system-lists';
import { systemListTypeSchema } from '@movies/api/validations';
import { revalidatePath } from 'next/cache';

import {
  revalidateUserPreferenceCache,
  revalidateUserListCache,
  revalidateUserListStatusCache,
  revalidateUserSystemListCache,
  revalidateUserSystemListPageCache,
} from '@/lib/cache-invalidation';

/** Next's server render cache and React Query are separate cache layers. */
export async function invalidateApiMutation(
  path: string,
  input: Record<string, unknown>,
  context: AppContext,
) {
  const user = await context.session?.current();
  if (!user) {
    return;
  }
  const domain = path.split('/')[1];
  switch (domain) {
    case 'preferences':
      invalidatePreferences(user.id);
      break;
    case 'customLists':
      invalidateCustomList(user.id, input);
      break;
    case 'systemLists':
      invalidateSystemList(user.id, input);
      break;
  }
}

function invalidatePreferences(userId: string) {
  revalidateUserPreferenceCache(userId);
  for (const page of ['/', '/settings', '/discover']) {
    revalidatePath(page);
  }
}

function invalidateCustomList(userId: string, input: Record<string, unknown>) {
  revalidateUserListCache(userId, typeof input.listId === 'string' ? input.listId : undefined);
  const resource = customListResourceInput.safeParse(input);
  if (resource.success) {
    revalidateUserListStatusCache(userId, resource.data.resourceType, resource.data.resourceId);
  }
  revalidatePath('/lists');
  revalidatePath('/lists/[id]', 'page');
}

function invalidateSystemList(userId: string, input: Record<string, unknown>) {
  const type = systemListTypeSchema.safeParse(input.listType);
  if (!type.success) {
    return;
  }
  revalidateUserSystemListPageCache(userId, type.data);
  const resource = systemListResourceInput.safeParse(input);
  if (resource.success) {
    revalidateUserSystemListCache(
      userId,
      type.data,
      resource.data.resourceType,
      resource.data.resourceId,
    );
    revalidatePath(`/${resource.data.resourceType}/${resource.data.resourceId}`);
  }
  revalidatePath(`/${type.data}`);
}
