import 'server-only';
import { moveIdToIndex } from '@movies/api/list-order';
import { pageWindow } from '@movies/api/paginate';
import {
  createListSchema,
  listIdSchema,
  listItemSchema,
  moveListSchema,
  removeListItemSchema,
  updateListSchema,
  type WatchProviderFilter,
} from '@movies/api/validations';
import { ITEMS_PER_PAGE, LISTS_PER_PAGE } from '@movies/config/constants';
import { and, asc, count, desc, eq, sql, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  createOrderingLock,
  listItemOrderingScope,
  listOrderingScope,
  nextPosition,
  rewriteListPositions,
  type OrderingTx,
} from './ordering-lock';
import { listItems, lists } from './schema/lists';
import { streamableOnProviders } from './title-availability';

export class CustomListNotFoundError extends Error {
  constructor() {
    super('List not found');
    this.name = 'CustomListNotFoundError';
  }
}

export class CustomListConflictError extends Error {
  constructor() {
    super('Item already in list');
    this.name = 'CustomListConflictError';
  }
}

const CUSTOM_LIST_TYPE = 'custom' as const;
const UNIQUE_VIOLATION = '23505';

function ownedCustomListsFilter(userId: string) {
  return and(eq(lists.userId, userId), eq(lists.type, CUSTOM_LIST_TYPE));
}

function manualListOrder() {
  return [asc(lists.position), desc(lists.createdAt)];
}

function itemManualOrder() {
  return [asc(listItems.position), desc(listItems.createdAt)];
}

function isUniqueViolation(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  const { cause } = error;
  if (typeof cause === 'object' && cause !== null && 'code' in cause) {
    if (cause.code === UNIQUE_VIOLATION) {
      return true;
    }
  }
  return error.message.includes('unique');
}

/** Canonical custom-list records for verified accounts; hosts own cache invalidation and title hydration. */
export function createCustomListStore(
  db: NodePgDatabase,
  ensureAvailabilityKnown: (scope: SQL | undefined) => Promise<unknown>,
) {
  const withOrderingLock = createOrderingLock(db);
  async function lockOwnedCustomList(tx: OrderingTx, userId: string, listId: string) {
    // The parent row lock also blocks ownership transfer until the item write commits.
    const rows = await tx
      .select({ id: lists.id })
      .from(lists)
      .where(and(eq(lists.id, listId), ownedCustomListsFilter(userId)))
      .for('update');
    if (rows.length === 0) {
      throw new CustomListNotFoundError();
    }
  }
  async function fetchOwnedCustomListRow(listId: string, userId: string) {
    const listResult = await db
      .select()
      .from(lists)
      .where(and(eq(lists.id, listId), ownedCustomListsFilter(userId)));

    if (listResult.length === 0) {
      throw new CustomListNotFoundError();
    }

    return listResult[0];
  }

  async function countListItems(where: SQL | undefined) {
    const rows = await db.select({ count: count() }).from(listItems).where(where);
    return rows[0]?.count ?? 0;
  }

  async function selectListItemsPage(where: SQL | undefined, totalItems: number, page: number) {
    const { offset, ...pagination } = pageWindow(totalItems, page, ITEMS_PER_PAGE);
    if (totalItems === 0) {
      return { items: [], ...pagination };
    }

    const items = await db
      .select()
      .from(listItems)
      .where(where)
      .orderBy(...itemManualOrder())
      .limit(ITEMS_PER_PAGE)
      .offset(offset);
    return { items, ...pagination };
  }

  async function queryUnfilteredListPage(list: typeof lists.$inferSelect, page: number) {
    const where = eq(listItems.listId, list.id);
    const totalItems = await countListItems(where);
    const itemsPage = await selectListItemsPage(where, totalItems, page);

    return { ...list, ...itemsPage, itemCount: totalItems };
  }

  async function queryProviderFilteredListPage(
    list: typeof lists.$inferSelect,
    page: number,
    providerFilter: WatchProviderFilter,
  ) {
    const scope = eq(listItems.listId, list.id);
    await ensureAvailabilityKnown(scope);

    const where = and(scope, streamableOnProviders(providerFilter));
    const itemCount = await countListItems(scope);
    const totalItems = await countListItems(where);
    const itemsPage = await selectListItemsPage(where, totalItems, page);

    return { ...list, ...itemsPage, itemCount };
  }

  async function owned(userId: string, listId: string) {
    const result = await db
      .select({ id: lists.id })
      .from(lists)
      .where(and(eq(lists.id, listId), ownedCustomListsFilter(userId)))
      .limit(1);
    return result[0] ?? null;
  }

  async function total(userId: string) {
    const rows = await db
      .select({ count: count() })
      .from(lists)
      .where(ownedCustomListsFilter(userId));
    return rows[0]?.count ?? 0;
  }

  async function index(userId: string, page: number = 1) {
    const totalItems = await total(userId);
    const { offset, ...pagination } = pageWindow(totalItems, page, LISTS_PER_PAGE);

    if (totalItems === 0) {
      return { lists: [], ...pagination };
    }

    const listsWithCounts = await db
      .select({
        id: lists.id,
        name: lists.name,
        description: lists.description,
        emoji: lists.emoji,
        createdAt: lists.createdAt,
        updatedAt: lists.updatedAt,
        itemCount: count(listItems.id),
      })
      .from(lists)
      .leftJoin(listItems, eq(lists.id, listItems.listId))
      .where(ownedCustomListsFilter(userId))
      .groupBy(lists.id)
      .orderBy(...manualListOrder())
      .limit(LISTS_PER_PAGE)
      .offset(offset);

    return { lists: listsWithCounts, ...pagination };
  }

  async function pageRows(
    userId: string,
    listId: string,
    page: number = 1,
    providerFilter: WatchProviderFilter | null = null,
  ) {
    const list = await fetchOwnedCustomListRow(listId, userId);
    if (providerFilter) {
      return queryProviderFilteredListPage(list, page, providerFilter);
    }
    return queryUnfilteredListPage(list, page);
  }

  async function createList(
    userId: string,
    name: string,
    description: string = '',
    emoji: string = '📝',
  ) {
    const validatedData = createListSchema.parse({ name, description, emoji });

    const listId = crypto.randomUUID();

    // Locked so concurrent creates can't read the same max(position) and append
    // to the same slot.
    await withOrderingLock(listOrderingScope(userId), async (tx) => {
      const position = await nextPosition(tx, lists, ownedCustomListsFilter(userId));
      await tx.insert(lists).values({
        id: listId,
        userId,
        name: validatedData.name,
        description: validatedData.description,
        emoji: validatedData.emoji,
        position,
      });
    });

    return { success: true, listId };
  }

  async function addToList(
    userId: string,
    listId: string,
    mediaId: number,
    mediaType: 'movie' | 'tv' | 'person',
  ) {
    const validatedData = listItemSchema.parse({
      listId,
      resourceId: mediaId,
      resourceType: mediaType,
    });

    try {
      // Locked so concurrent adds can't read the same max(position) and append
      // to the same slot.
      await withOrderingLock(listItemOrderingScope(validatedData.listId), async (tx) => {
        await lockOwnedCustomList(tx, userId, validatedData.listId);
        const position = await nextPosition(
          tx,
          listItems,
          eq(listItems.listId, validatedData.listId),
        );
        await tx.insert(listItems).values({
          id: crypto.randomUUID(),
          listId: validatedData.listId,
          resourceId: validatedData.resourceId,
          resourceType: validatedData.resourceType,
          position,
        });
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new CustomListConflictError();
      }
      throw error;
    }
  }

  async function removeFromList(
    userId: string,
    listId: string,
    mediaId: number,
    mediaType: 'movie' | 'tv' | 'person',
  ) {
    const validatedData = removeListItemSchema.parse({
      listId,
      resourceId: mediaId,
      resourceType: mediaType,
    });

    await withOrderingLock(listItemOrderingScope(validatedData.listId), async (tx) => {
      await lockOwnedCustomList(tx, userId, validatedData.listId);
      await tx
        .delete(listItems)
        .where(
          and(
            eq(listItems.listId, validatedData.listId),
            eq(listItems.resourceId, validatedData.resourceId),
            eq(listItems.resourceType, validatedData.resourceType),
          ),
        );
    });
  }

  async function deleteList(userId: string, listId: string) {
    if (!listIdSchema.safeParse(listId).success) {
      throw new Error('Invalid list ID');
    }

    const deleted = await db
      .delete(lists)
      .where(and(eq(lists.id, listId), ownedCustomListsFilter(userId)))
      .returning({ id: lists.id });
    if (deleted.length === 0) {
      throw new CustomListNotFoundError();
    }
  }

  async function updateList(
    userId: string,
    listId: string,
    name: string,
    description: string = '',
    emoji: string = '📝',
  ) {
    const validatedData = updateListSchema.parse({
      listId,
      name,
      description,
      emoji,
    });

    const updated = await db
      .update(lists)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        emoji: validatedData.emoji,
        updatedAt: new Date(),
      })
      .where(and(eq(lists.id, validatedData.listId), ownedCustomListsFilter(userId)))
      .returning({ id: lists.id });
    if (updated.length === 0) {
      throw new CustomListNotFoundError();
    }
  }

  async function moveList(userId: string, listId: string, position: number) {
    const validatedData = moveListSchema.parse({ listId, position });

    // The current order is read and rewritten under one lock so a concurrent
    // move can't compute from a stale snapshot and overwrite this one.
    await withOrderingLock(listOrderingScope(userId), async (tx) => {
      const orderedRows = await tx
        .select({ id: lists.id })
        .from(lists)
        .where(ownedCustomListsFilter(userId))
        .orderBy(...manualListOrder());

      const orderedIds = moveIdToIndex(
        orderedRows.map((row) => row.id),
        validatedData.listId,
        validatedData.position,
      );

      if (orderedIds === null) {
        throw new CustomListNotFoundError();
      }

      await rewriteListPositions(tx, userId, orderedIds);
    });
  }

  async function status(userId: string, mediaId: number, mediaType: 'movie' | 'tv' | 'person') {
    try {
      const listsWithStatusAndCounts = await db
        .select({
          id: lists.id,
          name: lists.name,
          description: lists.description,
          emoji: lists.emoji,
          createdAt: lists.createdAt,
          updatedAt: lists.updatedAt,
          itemCount: count(listItems.id),
          hasItem: sql<boolean>`coalesce(bool_or(
          ${listItems.resourceId} = ${mediaId} AND
          ${listItems.resourceType} = ${mediaType}
        ), false)`.mapWith(Boolean),
        })
        .from(lists)
        .leftJoin(listItems, eq(lists.id, listItems.listId))
        .where(ownedCustomListsFilter(userId))
        .groupBy(
          lists.id,
          lists.name,
          lists.description,
          lists.emoji,
          lists.createdAt,
          lists.updatedAt,
        )
        .orderBy(...manualListOrder());

      return listsWithStatusAndCounts;
    } catch (error) {
      console.error('Error fetching user lists with status:', error);
      throw new Error('Failed to fetch user lists');
    }
  }

  return {
    owned,
    total,
    index,
    pageRows,
    create: createList,
    add: addToList,
    remove: removeFromList,
    delete: deleteList,
    update: updateList,
    move: moveList,
    status,
  };
}
