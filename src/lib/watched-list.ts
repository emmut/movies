import 'server-only';

import { and, eq } from 'drizzle-orm';

import { lists } from '@/db/schema/lists';
import { db } from '@/lib/db';

export const WATCHED_LIST_TYPE = 'watched' as const;
// Internal name for the system list; never shown in the lists UI.
const WATCHED_LIST_NAME = 'Watched';

/**
 * Returns the id of the user's watched system list, or `null` if the user
 * has never marked anything as watched.
 */
export async function getWatchedListId(userId: string): Promise<string | null> {
  const result = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.userId, userId), eq(lists.type, WATCHED_LIST_TYPE)))
    .limit(1);

  return result[0]?.id ?? null;
}

/**
 * Returns the id of the user's watched system list, creating it if missing.
 *
 * Safe under concurrency: the partial unique index on (userId) where
 * type = 'watched' guarantees at most one row, so a lost insert race falls
 * back to re-selecting the winner's row.
 */
export async function getOrCreateWatchedListId(userId: string): Promise<string> {
  const existingId = await getWatchedListId(userId);
  if (existingId !== null) {
    return existingId;
  }

  const inserted = await db
    .insert(lists)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: WATCHED_LIST_NAME,
      type: WATCHED_LIST_TYPE,
    })
    .onConflictDoNothing()
    .returning({ id: lists.id });

  if (inserted.length > 0) {
    return inserted[0].id;
  }

  const winnerId = await getWatchedListId(userId);
  if (winnerId === null) {
    throw new Error('Failed to create watched list');
  }
  return winnerId;
}
