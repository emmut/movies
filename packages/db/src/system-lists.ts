import 'server-only';
import { pageWindow } from '@movies/api/paginate';
import {
  systemListTypeSchema,
  type SystemListType,
  type WatchProviderFilter,
} from '@movies/api/validations';
import { ITEMS_PER_PAGE } from '@movies/config/constants';
import { createOrderingLock, listItemOrderingScope, nextPosition } from '@movies/db/ordering-lock';
import { listItems, lists } from '@movies/db/schema/lists';
import { streamableOnProviders } from '@movies/db/title-availability';
import { and, asc, count, desc, eq, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// Internal names for the per-user singleton system lists; never shown in the
// lists UI.
const SYSTEM_LIST_NAMES: Record<SystemListType, string> = {
  watchlist: 'Watchlist',
  watched: 'Watched',
};

/** Data access for the per-user singleton system lists (watchlist, watched). */
export function createSystemListStore(db: NodePgDatabase) {
  const withOrderingLock = createOrderingLock(db);

  /**
   * Returns the id of the user's system list of the given type, or `null` if
   * the user has never added anything to it.
   */
  async function getSystemListId(userId: string, listType: SystemListType): Promise<string | null> {
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
  async function getOrCreateSystemListId(
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
  async function toggleSystemListRow(
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

    // Locked so concurrent adds can't read the same max(position) and append to
    // the same slot.
    const inserted = await withOrderingLock(listItemOrderingScope(listId), async (tx) => {
      // Append to the end of the list's manual ordering for this resource type.
      const position = await nextPosition(
        tx,
        listItems,
        and(eq(listItems.listId, listId), eq(listItems.resourceType, resourceType)),
      );
      return await tx
        .insert(listItems)
        .values({ id: crypto.randomUUID(), listId, resourceId, resourceType, position })
        .onConflictDoNothing()
        .returning({ id: listItems.id });
    });

    return inserted.length > 0 ? 'added' : 'unchanged';
  }

  function systemListRowFilter(listId: string, resourceId: number, resourceType: string) {
    return and(
      eq(listItems.listId, listId),
      eq(listItems.resourceId, resourceId),
      eq(listItems.resourceType, resourceType),
    );
  }

  /**
   * Copies the anonymous user's system list items (watchlist, watched, …) into
   * the linked account's list of the same type, creating it if missing.
   * Duplicates are handled by the unique constraint on
   * (listId, resourceId, resourceType).
   */
  async function transferSystemListItems(
    anonymousUserId: string,
    newUserId: string,
  ): Promise<void> {
    for (const listType of systemListTypeSchema.options) {
      const anonymousItems = await db
        .select({
          resourceId: listItems.resourceId,
          resourceType: listItems.resourceType,
        })
        .from(listItems)
        .innerJoin(lists, eq(listItems.listId, lists.id))
        .where(and(eq(lists.userId, anonymousUserId), eq(lists.type, listType)));

      if (anonymousItems.length === 0) {
        continue;
      }

      const targetListId = await getOrCreateSystemListId(newUserId, listType);
      await db
        .insert(listItems)
        .values(
          anonymousItems.map(({ resourceId, resourceType }) => ({
            id: crypto.randomUUID(),
            resourceId,
            resourceType,
            listId: targetListId,
          })),
        )
        .onConflictDoNothing();
    }
  }

  function scope(userId: string, listType: SystemListType, resourceType: string) {
    return and(
      eq(lists.userId, userId),
      eq(lists.type, listType),
      eq(listItems.resourceType, resourceType),
    );
  }

  async function membership(
    userId: string,
    listType: SystemListType,
    resourceId: number,
    resourceType: string,
  ) {
    const rows = await db
      .select({ id: listItems.id })
      .from(listItems)
      .innerJoin(lists, eq(listItems.listId, lists.id))
      .where(and(scope(userId, listType, resourceType), eq(listItems.resourceId, resourceId)))
      .limit(1);
    return rows.length > 0;
  }

  async function countRows(filter: SQL | undefined) {
    const rows = await db
      .select({ count: count() })
      .from(listItems)
      .innerJoin(lists, eq(listItems.listId, lists.id))
      .where(filter);
    return rows[0]?.count ?? 0;
  }

  async function countItems(userId: string, listType: SystemListType, resourceType: string) {
    return countRows(scope(userId, listType, resourceType));
  }

  async function pageRows(
    userId: string,
    listType: SystemListType,
    resourceType: 'movie' | 'tv',
    page: number,
    providerFilter: WatchProviderFilter | null,
    ensureAvailability: (scope: SQL | undefined) => Promise<unknown>,
  ) {
    let filter = scope(userId, listType, resourceType);
    if (providerFilter) {
      await ensureAvailability(filter);
      filter = and(filter, streamableOnProviders(providerFilter));
    }
    const totalItems = await countRows(filter);
    const { offset, ...pagination } = pageWindow(totalItems, page, ITEMS_PER_PAGE);
    if (totalItems === 0) {
      return { items: [], ...pagination };
    }
    const items = await db
      .select({
        id: listItems.id,
        resourceId: listItems.resourceId,
        resourceType: listItems.resourceType,
        createdAt: listItems.createdAt,
      })
      .from(listItems)
      .innerJoin(lists, eq(listItems.listId, lists.id))
      .where(filter)
      .orderBy(asc(listItems.position), desc(listItems.createdAt))
      .limit(ITEMS_PER_PAGE)
      .offset(offset);
    return { items, ...pagination };
  }

  return {
    getSystemListId,
    getOrCreateSystemListId,
    toggleSystemListRow,
    transferSystemListItems,
    membership,
    countItems,
    pageRows,
  };
}
