import 'server-only';
import { moveIdToIndex } from '@movies/api/list-order';
import type { SystemListType } from '@movies/api/validations';
import { listItems, lists } from '@movies/db/schema/lists';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { createOrderingLock, listItemOrderingScope } from './ordering-lock';

export class ListItemNotFoundError extends Error {
  constructor() { super('Item not found'); this.name = 'ListItemNotFoundError'; }
}

type MoveInput = { itemId: string; position: number; resourceType?: 'movie' | 'tv' | 'person'; listType?: SystemListType };

/** Host/session validation happens before this ownership-scoped transaction. */
export function createListItemOrderingStore(db: NodePgDatabase) {
  const withOrderingLock = createOrderingLock(db);
  async function move(userId: string, input: MoveInput) {
    const itemRows = await db.select({ listId: listItems.listId, listType: lists.type })
      .from(listItems).innerJoin(lists, eq(listItems.listId, lists.id))
      .where(and(eq(listItems.id, input.itemId), eq(lists.userId, userId), input.listType ? eq(lists.type, input.listType) : undefined)).limit(1);
    if (itemRows.length === 0) { throw new ListItemNotFoundError(); }
    const { listId, listType } = itemRows[0];
    const orderWhere = input.resourceType
      ? and(eq(listItems.listId, listId), eq(listItems.resourceType, input.resourceType))
      : eq(listItems.listId, listId);
    await withOrderingLock(listItemOrderingScope(listId), async (tx) => {
      const rows = await tx.select({ id: listItems.id }).from(listItems).where(orderWhere)
        .orderBy(asc(listItems.position), desc(listItems.createdAt));
      const orderedIds = moveIdToIndex(rows.map((row) => row.id), input.itemId, input.position);
      if (!orderedIds) { throw new ListItemNotFoundError(); }
      await tx.execute(sql`
        update ${listItems} set position = ord.position
        from unnest(${sql.param(orderedIds)}::text[]) with ordinality as ord(id, position)
        where ${listItems.id} = ord.id and ${listItems.listId} = ${listId}
      `);
    });
    return { listId, listType };
  }
  return { move };
}
