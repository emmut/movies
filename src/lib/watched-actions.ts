'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { listItems } from '@/db/schema/lists';
import { requireUser } from '@/lib/auth-server';
import { revalidateUserWatchedCache } from '@/lib/cache-invalidation';
import { db } from '@/lib/db';
import { resourceIdSchema } from '@/lib/validations';
import { getOrCreateWatchedListId, getWatchedListId } from '@/lib/watched-list';

type ToggleWatchedParams = {
  resourceId: number;
  resourceType: string;
};

/**
 * Adds or removes a resource from the authenticated user's watched history, toggling its presence.
 *
 * The watched history is stored as a per-user system list (`lists.type = 'watched'`),
 * created lazily on the first add. If the resource is already marked as watched,
 * the mark is removed; otherwise, it is added. The function revalidates the
 * cache for both the resource page and the watched page after the operation.
 *
 * @param resourceId - The unique identifier of the resource to toggle.
 * @param resourceType - The type of the resource (e.g., "movie", "tv").
 * @returns An object indicating success and the action performed: `'added'`, `'removed'`, or `'unchanged'`.
 *
 * @throws {Error} If the operation fails due to a database error or other unexpected issue.
 * @remark Redirects to the login page if no authenticated user is found.
 */
export async function toggleWatched({ resourceId, resourceType }: ToggleWatchedParams) {
  const validatedResourceId = resourceIdSchema.parse({
    resourceId,
    resourceType,
  });

  const user = await requireUser();

  try {
    const watchedListId = await getWatchedListId(user.id);

    // Toggle: delete returns the removed row(s); an empty result (or no
    // watched list yet) means the item was absent, so we insert it instead.
    let removed: Array<{ id: string }> = [];
    if (watchedListId !== null) {
      removed = await db
        .delete(listItems)
        .where(
          and(
            eq(listItems.listId, watchedListId),
            eq(listItems.resourceId, validatedResourceId.resourceId),
            eq(listItems.resourceType, validatedResourceId.resourceType),
          ),
        )
        .returning({ id: listItems.id });
    }

    let state;
    if (removed.length > 0) {
      state = 'removed';
    } else {
      const listId = watchedListId ?? (await getOrCreateWatchedListId(user.id));
      // A concurrent request may have inserted the row between our delete and
      // this insert; onConflictDoNothing then makes it a no-op. Trust the
      // returned rows, not the attempt, so callers don't show a false "added".
      const inserted = await db
        .insert(listItems)
        .values({
          id: crypto.randomUUID(),
          listId,
          resourceId: validatedResourceId.resourceId,
          resourceType: validatedResourceId.resourceType,
        })
        .onConflictDoNothing()
        .returning({ id: listItems.id });
      state = inserted.length > 0 ? 'added' : 'unchanged';
    }

    revalidateUserWatchedCache(
      user.id,
      validatedResourceId.resourceType,
      validatedResourceId.resourceId,
    );

    revalidatePath(`/${validatedResourceId.resourceType}/${validatedResourceId.resourceId}`);
    revalidatePath('/watched');

    return { success: true, action: state };
  } catch (error) {
    console.error('Error toggling watched:', error);
    throw new Error('Failed to update watched history');
  }
}
