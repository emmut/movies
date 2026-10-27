import 'server-only';
import { listItems, lists } from '@movies/db/schema/lists';
import { and, eq, max, sql, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/** The transaction handle `withOrderingLock` hands to its callback. */
export type OrderingTx = Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];

/** A table with a manual `position` ordering keyed by a text `id`. */
type OrderedTable = typeof lists | typeof listItems;

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
export function createOrderingLock(db: NodePgDatabase) {
  return async function withOrderingLock<T>(
    scope: string,
    fn: (tx: OrderingTx) => Promise<T>,
  ): Promise<T> {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${scope}, 0))`);
      return await fn(tx);
    });
  };
}

/**
 * The position that appends a row to the end of the ordering selected by
 * `where`. Call it under the ordering lock so the read and the insert that
 * uses it can't interleave with another writer.
 */
export async function nextPosition(tx: OrderingTx, table: OrderedTable, where: SQL | undefined) {
  const rows = await tx
    .select({ lastPosition: max(table.position) })
    .from(table)
    .where(where);
  const lastPosition = rows[0]?.lastPosition ?? 0;
  return lastPosition + 1;
}

/** `ord(id, position)`: the given ids paired with their 1-based positions. */
function ordinalsOf(orderedIds: string[]) {
  return sql`unnest(${sql.param(orderedIds)}::text[]) with ordinality as ord(id, position)`;
}

/**
 * Rewrites the manual ordering of a user's custom lists in one statement,
 * assigning 1-based positions from the given id order. Reordering is not an
 * edit, so `updated_at` keeps its value.
 */
export async function rewriteListPositions(tx: OrderingTx, userId: string, orderedIds: string[]) {
  await tx
    .update(lists)
    .set({ position: sql`ord.position`, updatedAt: sql`${lists.updatedAt}` })
    .from(ordinalsOf(orderedIds))
    .where(and(eq(lists.id, sql`ord.id`), eq(lists.userId, userId)));
}

/**
 * Rewrites the manual ordering of a list's items in one statement, assigning
 * 1-based positions from the given id order.
 */
export async function rewriteListItemPositions(
  tx: OrderingTx,
  listId: string,
  orderedIds: string[],
) {
  await tx
    .update(listItems)
    .set({ position: sql`ord.position` })
    .from(ordinalsOf(orderedIds))
    .where(and(eq(listItems.id, sql`ord.id`), eq(listItems.listId, listId)));
}
