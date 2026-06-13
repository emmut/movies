'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { watchlist } from '@/db/schema/watchlist';
import { requireUser } from '@/lib/auth-server';
import { revalidateUserWatchlistCache } from '@/lib/cache-invalidation';
import { db } from '@/lib/db';
import { resourceIdSchema } from '@/lib/validations';

type ToggleWatchlistParams = {
  resourceId: number;
  resourceType: string;
};

/**
 * Adds or removes a resource from the authenticated user's watchlist, toggling its presence.
 *
 * If the resource is already in the user's watchlist, it is removed; otherwise, it is added. The function revalidates the cache for both the resource page and the watchlist page after the operation.
 *
 * @param resourceId - The unique identifier of the resource to toggle.
 * @param resourceType - The type of the resource (e.g., "movie", "show").
 * @returns An object indicating success and the action performed: either `'added'` or `'removed'`.
 *
 * @throws {Error} If the operation fails due to a database error or other unexpected issue.
 * @remark Redirects to the login page if no authenticated user is found.
 */
export async function toggleWatchlist({ resourceId, resourceType }: ToggleWatchlistParams) {
  const validatedResourceId = resourceIdSchema.parse({
    resourceId,
    resourceType,
  });

  const user = await requireUser();

  try {
    // Toggle in a single round-trip: delete returns the removed row(s); an empty
    // result means the item was absent, so we insert it instead.
    const removed = await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, user.id),
          eq(watchlist.resourceId, validatedResourceId.resourceId),
          eq(watchlist.resourceType, validatedResourceId.resourceType),
        ),
      )
      .returning({ id: watchlist.id });

    let state;
    if (removed.length > 0) {
      state = 'removed';
    } else {
      // A concurrent request may have inserted the row between our delete and
      // this insert; onConflictDoNothing then makes it a no-op. Trust the
      // returned rows, not the attempt, so callers don't show a false "added".
      const inserted = await db
        .insert(watchlist)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          resourceId: validatedResourceId.resourceId,
          resourceType: validatedResourceId.resourceType,
        })
        .onConflictDoNothing()
        .returning({ id: watchlist.id });
      state = inserted.length > 0 ? 'added' : 'unchanged';
    }

    revalidateUserWatchlistCache(
      user.id,
      validatedResourceId.resourceType,
      validatedResourceId.resourceId,
    );

    revalidatePath(`/${validatedResourceId.resourceType}/${validatedResourceId.resourceId}`);
    revalidatePath('/watchlist');

    return { success: true, action: state };
  } catch (error) {
    console.error('Error toggling watchlist:', error);
    throw new Error('Failed to update watchlist');
  }
}
