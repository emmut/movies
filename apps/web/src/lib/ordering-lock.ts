import 'server-only';
import { sql } from 'drizzle-orm';

import { db } from '@/lib/db';

/** The transaction handle `withOrderingLock` hands to its callback. */
export type OrderingTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Lock scope for the manual ordering of a user's custom lists. */
export function listOrderingScope(userId: string) {
  return `lists:${userId}`;
}

/** Lock scope for the manual ordering of a single list's items. */
export function listItemOrderingScope(listId: string) {
  return `list-items:${listId}`;
}

/**
 * Serializes writers of a manual `position` ordering.
 *
 * Every position write is read-then-write (append reads `max(position)`,
 * reorder reads the full current order), so two concurrent calls for the same
 * scope can act on the same snapshot and persist duplicate positions or
 * silently overwrite each other's order. A per-scope Postgres advisory lock,
 * held until the enclosing transaction ends, makes those writers run one at a
 * time; writers for other scopes are unaffected.
 *
 * @param scope - Lock key naming the ordering being written, e.g.
 *   `lists:<userId>` or `list-items:<listId>`.
 */
export async function withOrderingLock<T>(
  scope: string,
  fn: (tx: OrderingTx) => Promise<T>,
): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${scope}, 0))`);
    return await fn(tx);
  });
}
