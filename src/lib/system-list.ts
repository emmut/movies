import 'server-only';

import { and, eq } from 'drizzle-orm';

import { listItems, lists } from '@/db/schema/lists';
import { db } from '@/lib/db';
import type { SystemListType } from '@/lib/validations';

// Internal names for the per-user singleton system lists; never shown in the
// lists UI.
const SYSTEM_LIST_NAMES: Record<SystemListType, string> = {
  watchlist: 'Watchlist',
  watched: 'Watched',
};

/**
 * Returns the id of the user's system list of the given type, or `null` if
 * the user has never added anything to it.
 */
export async function getSystemListId(
  userId: string,
  listType: SystemListType,
): Promise<string | null> {
  const result = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.userId, userId), eq(lists.type, listType)))
    .limit(1);

  return result[0]?.id ?? null;
}

/**
 * Returns the id of the user's system list of the given type, creating it if
 * missing.
 *
 * Safe under concurrency: the partial unique index on (userId) for each
 * system list type guarantees at most one row, so a lost insert race falls
 * back to re-selecting the winner's row.
 */
export async function getOrCreateSystemListId(
  userId: string,
  listType: SystemListType,
): Promise<string> {
  const existingId = await getSystemListId(userId, listType);
  if (existingId !== null) {
    return existingId;
  }

  const inserted = await db
    .insert(lists)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: SYSTEM_LIST_NAMES[listType],
      type: listType,
    })
    .onConflictDoNothing()
    .returning({ id: lists.id });

  if (inserted.length > 0) {
    return inserted[0].id;
  }

  const winnerId = await getSystemListId(userId, listType);
  if (winnerId === null) {
    throw new Error(`Failed to create ${listType} list`);
  }
  return winnerId;
}

/**
 * Adds or removes a row in the user's system list, creating the list lazily.
 *
 * A concurrent request may insert the row between our delete and the insert;
 * onConflictDoNothing then makes it a no-op. Trust the returned rows, not the
 * attempt, so callers don't show a false "added".
 */
export async function toggleSystemListRow(
  userId: string,
  listType: SystemListType,
  resourceId: number,
  resourceType: string,
): Promise<'added' | 'removed' | 'unchanged'> {
  const listId = await getOrCreateSystemListId(userId, listType);

  const removed = await db
    .delete(listItems)
    .where(systemListRowFilter(listId, resourceId, resourceType))
    .returning({ id: listItems.id });

  if (removed.length > 0) {
    return 'removed';
  }

  const inserted = await db
    .insert(listItems)
    .values({
      id: crypto.randomUUID(),
      listId,
      resourceId,
      resourceType,
    })
    .onConflictDoNothing()
    .returning({ id: listItems.id });

  return inserted.length > 0 ? 'added' : 'unchanged';
}

/**
 * Removes a row from the user's system list if present.
 *
 * @returns `true` if a row was removed; `false` if the list doesn't exist or
 * the row was absent.
 */
export async function removeSystemListRow(
  userId: string,
  listType: SystemListType,
  resourceId: number,
  resourceType: string,
): Promise<boolean> {
  const listId = await getSystemListId(userId, listType);
  if (listId === null) {
    return false;
  }

  const removed = await db
    .delete(listItems)
    .where(systemListRowFilter(listId, resourceId, resourceType))
    .returning({ id: listItems.id });

  return removed.length > 0;
}

function systemListRowFilter(listId: string, resourceId: number, resourceType: string) {
  return and(
    eq(listItems.listId, listId),
    eq(listItems.resourceId, resourceId),
    eq(listItems.resourceType, resourceType),
  );
}
