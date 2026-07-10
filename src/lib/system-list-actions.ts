'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth-server';
import { revalidateUserSystemListCache } from '@/lib/cache-invalidation';
import { removeSystemListRow, toggleSystemListRow } from '@/lib/system-list';
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
 * `lists.type`), created lazily on the first toggle. Marking a resource as
 * watched also removes it from the watchlist: it has been seen, so it no
 * longer needs saving for later. The function revalidates the cache for both
 * the resource page and the system list page after the operation.
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

    if (validatedListType === 'watched' && state === 'added') {
      await removeWatchedItemFromWatchlist(user.id, validatedResourceId);
    }

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

/**
 * A freshly watched resource no longer belongs on the watchlist; drop it and
 * refresh the watchlist caches only when a row was actually removed.
 */
async function removeWatchedItemFromWatchlist(
  userId: string,
  resource: { resourceId: number; resourceType: string },
) {
  const removed = await removeSystemListRow(
    userId,
    'watchlist',
    resource.resourceId,
    resource.resourceType,
  );
  if (!removed) {
    return;
  }

  revalidateUserSystemListCache(userId, 'watchlist', resource.resourceType, resource.resourceId);
  revalidatePath('/watchlist');
}
