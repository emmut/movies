'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { watchlist } from '@/db/schema/watchlist';
import { getUser } from '@/lib/auth-server';
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

  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  try {
    const existing = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, user.id),
          eq(watchlist.resourceId, validatedResourceId.resourceId),
          eq(watchlist.resourceType, validatedResourceId.resourceType),
        ),
      );

    let state;
    if (existing.length > 0) {
      await db
        .delete(watchlist)
        .where(
          and(
            eq(watchlist.userId, user.id),
            eq(watchlist.resourceId, validatedResourceId.resourceId),
            eq(watchlist.resourceType, validatedResourceId.resourceType),
          ),
        );
      state = 'removed';
    } else {
      await db.insert(watchlist).values({
        id: crypto.randomUUID(),
        userId: user.id,
        resourceId: validatedResourceId.resourceId,
        resourceType: validatedResourceId.resourceType,
      });
      state = 'added';
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
