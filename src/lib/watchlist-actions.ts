'use server';

import { watchlist } from '@/db/schema';
import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { movieIdSchema } from '@/lib/validations';
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
export async function addToWatchlist(movieId: number) {
  const validatedMovieId = movieIdSchema.parse(movieId);

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
          eq(watchlist.movieId, validatedMovieId)
        )
      );

    if (existing.length > 0) {
      throw new Error('Movie already in watchlist');
    }

    await db.insert(watchlist).values({
      id: crypto.randomUUID(),
      userId: user.id,
      movieId: validatedMovieId,
    });

    revalidatePath('/watchlist');
    revalidatePath(`/movie/${validatedMovieId}`);

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
export async function removeFromWatchlist(movieId: number) {
  const validatedMovieId = movieIdSchema.parse(movieId);

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
          eq(watchlist.movieId, validatedMovieId)
        )
      );

    revalidatePath('/watchlist');
    revalidatePath(`/movie/${validatedMovieId}`);

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
export async function toggleWatchlist(movieId: number) {
  const validatedMovieId = movieIdSchema.parse(movieId);

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
          eq(watchlist.movieId, validatedMovieId)
        )
      );

    let state;
    if (existing.length > 0) {
      await db
        .delete(watchlist)
        .where(
          and(
            eq(watchlist.userId, user.id),
            eq(watchlist.movieId, validatedMovieId)
          )
        );
      state = 'removed';
    } else {
      await db.insert(watchlist).values({
        id: crypto.randomUUID(),
        userId: user.id,
        movieId: validatedMovieId,
      });
      state = 'added';
    }

    revalidatePath(`/movie/${validatedMovieId}`);
    revalidatePath('/watchlist');

    return { success: true, action: state };
  } catch (error) {
    console.error('Error toggling watchlist:', error);
    throw new Error('Failed to update watchlist');
  }
}
