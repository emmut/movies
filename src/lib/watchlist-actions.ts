'use server';

import { watchlist } from '@/db/schema';
import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function addToWatchlist(movieId: number) {
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
          eq(watchlist.movieId, String(movieId))
        )
      );

    if (existing.length > 0) {
      throw new Error('Movie already in watchlist');
    }

    await db.insert(watchlist).values({
      id: crypto.randomUUID(),
      userId: user.id,
      movieId: String(movieId),
    });

    revalidatePath('/watchlist');
    revalidatePath(`/movie/${movieId}`);

    return { success: true };
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw new Error('Failed to add movie to watchlist');
  }
}

export async function removeFromWatchlist(movieId: number) {
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
          eq(watchlist.movieId, String(movieId))
        )
      );

    revalidatePath('/watchlist');
    revalidatePath(`/movie/${movieId}`);

    return { success: true };
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw new Error('Failed to remove movie from watchlist');
  }
}

export async function toggleWatchlist(movieId: number) {
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
          eq(watchlist.movieId, String(movieId))
        )
      );

    if (existing.length > 0) {
      await removeFromWatchlist(movieId);
      return { success: true, action: 'removed' };
    } else {
      await addToWatchlist(movieId);
      return { success: true, action: 'added' };
    }
  } catch (error) {
    console.error('Error toggling watchlist:', error);
    throw new Error('Failed to update watchlist');
  }
}
