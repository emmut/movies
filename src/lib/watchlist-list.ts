import 'server-only';

import { and, eq } from 'drizzle-orm';

import { lists } from '@/db/schema/lists';
import { db } from '@/lib/db';

export const WATCHLIST_LIST_TYPE = 'watchlist' as const;
// Internal name for the system list; never shown in the lists UI.
const WATCHLIST_LIST_NAME = 'Watchlist';

/**
 * Returns the id of the user's watchlist system list, or `null` if the user
 * has never added anything to their watchlist.
 */
export async function getWatchlistListId(userId: string): Promise<string | null> {
  const result = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.userId, userId), eq(lists.type, WATCHLIST_LIST_TYPE)))
    .limit(1);

  return result[0]?.id ?? null;
}

/**
 * Returns the id of the user's watchlist system list, creating it if missing.
 *
 * Safe under concurrency: the partial unique index on (userId) where
 * type = 'watchlist' guarantees at most one row, so a lost insert race falls
 * back to re-selecting the winner's row.
 */
export async function getOrCreateWatchlistListId(userId: string): Promise<string> {
  const existingId = await getWatchlistListId(userId);
  if (existingId !== null) {
    return existingId;
  }

  const inserted = await db
    .insert(lists)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: WATCHLIST_LIST_NAME,
      type: WATCHLIST_LIST_TYPE,
    })
    .onConflictDoNothing()
    .returning({ id: lists.id });

  if (inserted.length > 0) {
    return inserted[0].id;
  }

  const winnerId = await getWatchlistListId(userId);
  if (winnerId === null) {
    throw new Error('Failed to create watchlist');
  }
  return winnerId;
}
