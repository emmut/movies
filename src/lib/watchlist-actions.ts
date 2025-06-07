'use server';

import { watchlist } from '@/db/schema';
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
