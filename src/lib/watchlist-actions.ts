'use server';

import { watchlist } from '@/db/schema/watchlist';
import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { resourceIdSchema } from '@/lib/validations';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Adds a movie to the authenticated user's watchlist.
 *
 * If the user is not logged in, redirects to the login page. Throws an error if the movie is already in the watchlist.
 *
 * @param movieId - The ID of the movie to add.
 * @returns An object indicating success.
 *
 * @throws {Error} If the movie is already in the user's watchlist.
 * @throws {Error} If the operation fails for any other reason.
 */
type AddToWatchlistParams = {
  resourceId: number;
  resourceType: string;
};

/**
 * Adds a resource to the authenticated user's watchlist.
 *
 * Validates the resource ID and type, ensures the user is authenticated, and prevents duplicate entries in the watchlist. Updates the cache for both the watchlist and the specific resource page upon successful addition.
 *
 * @param resourceId - The unique identifier of the resource to add.
 * @param resourceType - The type of the resource (e.g., "movie", "show").
 * @returns An object indicating success.
 *
 * @throws {Error} If the resource is already in the user's watchlist or if the operation fails.
 */
export async function addToWatchlist({
  resourceId,
  resourceType,
}: AddToWatchlistParams) {
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
          eq(watchlist.resourceType, validatedResourceId.resourceType)
        )
      );

    if (existing.length > 0) {
      throw new Error('Movie already in watchlist');
    }

    await db.insert(watchlist).values({
      id: crypto.randomUUID(),
      userId: user.id,
      resourceId: validatedResourceId.resourceId,
      resourceType: validatedResourceId.resourceType,
    });

    revalidatePath('/watchlist');
    revalidatePath(
      `/${validatedResourceId.resourceType}/${validatedResourceId.resourceId}`
    );

    return { success: true };
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw new Error('Failed to add movie to watchlist');
  }
}

/**
 * Removes a movie from the authenticated user's watchlist.
 *
 * Redirects to the login page if no user is authenticated. After removal, revalidates the watchlist and movie pages to ensure cache consistency.
 *
 * @param movieId - The ID of the movie to remove from the watchlist.
 * @returns An object indicating successful removal.
 *
 * @throws {Error} If the removal operation fails.
 */
type RemoveFromWatchlistParams = {
  resourceId: number;
  resourceType: string;
};

/**
 * Removes a resource from the authenticated user's watchlist.
 *
 * @param resourceId - The unique identifier of the resource to remove.
 * @param resourceType - The type of the resource (e.g., movie, show).
 * @returns An object indicating successful removal.
 *
 * @throws {Error} If the removal operation fails.
 * @remark Redirects to the login page if no authenticated user is found.
 */
export async function removeFromWatchlist({
  resourceId,
  resourceType,
}: RemoveFromWatchlistParams) {
  const validatedResourceId = resourceIdSchema.parse({
    resourceId,
    resourceType,
  });

  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  try {
    await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, user.id),
          eq(watchlist.resourceId, validatedResourceId.resourceId),
          eq(watchlist.resourceType, validatedResourceId.resourceType)
        )
      );

    revalidatePath('/watchlist');
    revalidatePath(
      `/${validatedResourceId.resourceType}/${validatedResourceId.resourceId}`
    );

    return { success: true };
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw new Error('Failed to remove movie from watchlist');
  }
}

/**
 * Adds or removes a movie from the authenticated user's watchlist, toggling its presence.
 *
 * If the movie is already in the user's watchlist, it is removed; otherwise, it is added.
 *
 * @param movieId - The ID of the movie to toggle in the watchlist.
 * @returns An object indicating success and whether the movie was 'added' or 'removed'.
 *
 * @throws {Error} If the user is not authenticated or if the watchlist update fails.
 */
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
export async function toggleWatchlist({
  resourceId,
  resourceType,
}: ToggleWatchlistParams) {
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
          eq(watchlist.resourceType, validatedResourceId.resourceType)
        )
      );

    let state;
    if (existing.length > 0) {
      await db
        .delete(watchlist)
        .where(
          and(
            eq(watchlist.userId, user.id),
            eq(watchlist.resourceId, validatedResourceId.resourceId),
            eq(watchlist.resourceType, validatedResourceId.resourceType)
          )
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

    revalidatePath(
      `/${validatedResourceId.resourceType}/${validatedResourceId.resourceId}`
    );
    revalidatePath('/watchlist');

    return { success: true, action: state };
  } catch (error) {
    console.error('Error toggling watchlist:', error);
    throw new Error('Failed to update watchlist');
  }
}
