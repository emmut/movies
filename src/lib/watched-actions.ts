'use server';

import { revalidatePath } from 'next/cache';

import { watched } from '@/db/schema/watched';
import { requireUser } from '@/lib/auth-server';
import { revalidateUserWatchedCache } from '@/lib/cache-invalidation';
import { toggleCollectionRow } from '@/lib/resource-collection';
import { resourceIdSchema } from '@/lib/validations';

type ToggleWatchedParams = {
  resourceId: number;
  resourceType: string;
};

/**
 * Adds or removes a resource from the authenticated user's watched history, toggling its presence.
 *
 * If the resource is already marked as watched, the mark is removed; otherwise, it is added. The function revalidates the cache for both the resource page and the watched page after the operation.
 *
 * @param resourceId - The unique identifier of the resource to toggle.
 * @param resourceType - The type of the resource (e.g., "movie", "tv").
 * @returns An object indicating success and the action performed: `'added'`, `'removed'`, or `'unchanged'`.
 *
 * @throws {Error} If the operation fails due to a database error or other unexpected issue.
 * @remark Redirects to the login page if no authenticated user is found.
 */
export async function toggleWatched({ resourceId, resourceType }: ToggleWatchedParams) {
  const validated = resourceIdSchema.parse({ resourceId, resourceType });

  const user = await requireUser();

  try {
    const state = await toggleCollectionRow(
      watched,
      user.id,
      validated.resourceId,
      validated.resourceType,
    );

    revalidateUserWatchedCache(user.id, validated.resourceType, validated.resourceId);

    revalidatePath(`/${validated.resourceType}/${validated.resourceId}`);
    revalidatePath('/watched');

    return { success: true, action: state };
  } catch (error) {
    console.error('Error toggling watched:', error);
    throw new Error('Failed to update watched history');
  }
}
