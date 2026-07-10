'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth-server';
import { revalidateUserSystemListCache } from '@/lib/cache-invalidation';
import { toggleSystemListRow } from '@/lib/system-list';
import { resourceIdSchema, SystemListType, systemListTypeSchema } from '@/lib/validations';

type ToggleSystemListItemParams = {
  listType: SystemListType;
  resourceId: number;
  resourceType: string;
};

/**
 * Adds or removes a resource from the authenticated user's system list of the
 * given type, toggling its presence.
 *
 * System lists are stored as per-user singleton rows in `lists` (one per
 * `lists.type`), created lazily on the first toggle. The lists are
 * independent: marking a resource as watched leaves the watchlist untouched.
 * The function revalidates the cache for both the resource page and the
 * system list page after the operation.
 *
 * @param listType - The system list to toggle in ('watchlist' or 'watched').
 * @param resourceId - The unique identifier of the resource to toggle.
 * @param resourceType - The type of the resource (e.g., "movie", "tv").
 * @returns An object indicating success and the action performed: `'added'`, `'removed'`, or `'unchanged'`.
 *
 * @throws {Error} If the operation fails due to a database error or other unexpected issue.
 * @remark Redirects to the login page if no authenticated user is found.
 */
export async function toggleSystemListItem({
  listType,
  resourceId,
  resourceType,
}: ToggleSystemListItemParams) {
  const validatedListType = systemListTypeSchema.parse(listType);
  const validatedResourceId = resourceIdSchema.parse({
    resourceId,
    resourceType,
  });

  const user = await requireUser();

  try {
    const state = await toggleSystemListRow(
      user.id,
      validatedListType,
      validatedResourceId.resourceId,
      validatedResourceId.resourceType,
    );

    revalidateUserSystemListCache(
      user.id,
      validatedListType,
      validatedResourceId.resourceType,
      validatedResourceId.resourceId,
    );

    revalidatePath(`/${validatedResourceId.resourceType}/${validatedResourceId.resourceId}`);
    revalidatePath(`/${validatedListType}`);

    return { success: true, action: state };
  } catch (error) {
    console.error(`Error toggling ${validatedListType}:`, error);
    throw new Error(`Failed to update ${validatedListType}`);
  }
}
