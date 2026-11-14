'use server';

import 'server-only';
import { systemListToggleInput } from '@movies/api/system-lists';
import type { SystemListType } from '@movies/api/validations';
import { createSystemListStore } from '@movies/db/system-lists';
import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth-server';
import { revalidateUserSystemListCache } from '@/lib/cache-invalidation';
import { db } from '@/lib/db';
import { scheduleTitleSync } from '@/lib/title-sync-server';

const { toggleSystemListRow } = createSystemListStore(db);

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
  const validated = systemListToggleInput.parse({ listType, resourceId, resourceType });

  const user = await requireUser();

  try {
    const state = await toggleSystemListRow(
      user.id,
      validated.listType,
      validated.resourceId,
      validated.resourceType,
    );

    if (state === 'added') {
      // Write the title's details and availability through to the local cache
      // so the provider filter can answer from SQL without a TMDB round-trip.
      scheduleTitleSync(validated.resourceType, validated.resourceId);
    }

    revalidateUserSystemListCache(
      user.id,
      validated.listType,
      validated.resourceType,
      validated.resourceId,
    );

    revalidatePath(`/${validated.resourceType}/${validated.resourceId}`);
    revalidatePath(`/${validated.listType}`);

    return { success: true, action: state };
  } catch (error) {
    console.error(`Error toggling ${validated.listType}:`, error);
    throw new Error(`Failed to update ${validated.listType}`);
  }
}
