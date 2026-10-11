import 'server-only';
import { moveIdToIndex } from '@movies/api/list-order';
import type { SystemListType } from '@movies/api/validations';
import { listItems, lists } from '@movies/db/schema/lists';
import { and, asc, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { createOrderingLock, listItemOrderingScope, rewriteListItemPositions } from './ordering-lock';

export class ListItemNotFoundError extends Error {
  constructor() {
    super('Item not found');
    this.name = 'ListItemNotFoundError';
  }
}

type MoveInput = {
  itemId: string;
  position: number;
  resourceType?: 'movie' | 'tv' | 'person';
  listType?: SystemListType;
};

/** Host/session validation happens before this ownership-scoped transaction. */
export function createListItemOrderingStore(db: NodePgDatabase) {
  const withOrderingLock = createOrderingLock(db);

  async function findOwnedItemList(userId: string, input: MoveInput) {
    let ownership = and(eq(listItems.id, input.itemId), eq(lists.userId, userId));
    if (input.listType) {
      ownership = and(ownership, eq(lists.type, input.listType));
    }
    const rows = await db
      .select({ listId: listItems.listId, listType: lists.type })
      .from(listItems)
      .innerJoin(lists, eq(listItems.listId, lists.id))
      .where(ownership)
      .limit(1);
    if (rows.length === 0) {
      throw new ListItemNotFoundError();
    }
    return rows[0];
  }

  /** Items reordered together: the whole list, or one resource type within it. */
  function orderingFilter(listId: string, resourceType: MoveInput['resourceType']) {
    const inList = eq(listItems.listId, listId);
    if (!resourceType) {
      return inList;
    }
    return and(inList, eq(listItems.resourceType, resourceType));
  }

  async function move(userId: string, input: MoveInput) {
    const { listId, listType } = await findOwnedItemList(userId, input);

    await withOrderingLock(listItemOrderingScope(listId), async (tx) => {
      const rows = await tx
        .select({ id: listItems.id })
        .from(listItems)
        .where(orderingFilter(listId, input.resourceType))
        .orderBy(asc(listItems.position), desc(listItems.createdAt));
      const currentIds = rows.map((row) => row.id);
      const orderedIds = moveIdToIndex(currentIds, input.itemId, input.position);
      if (!orderedIds) {
        throw new ListItemNotFoundError();
      }
      await rewriteListItemPositions(tx, listId, orderedIds);
    });

    return { listId, listType };
  }

  return { move };
}
