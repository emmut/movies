import 'server-only';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { listOrderingScope, lockOrderingScopes, nextPosition } from './ordering-lock';
import { lists } from './schema/lists';

/** Move the guest's custom lists intact, appending them after the destination's own ordering. */
export async function transferCustomListOwnership(
  db: NodePgDatabase,
  anonymousUserId: string,
  accountUserId: string,
) {
  if (anonymousUserId === accountUserId) {
    return;
  }
  await db.transaction(async (tx) => {
    await lockOrderingScopes(tx, [
      listOrderingScope(anonymousUserId),
      listOrderingScope(accountUserId),
    ]);
    const source = await tx
      .select({ id: lists.id })
      .from(lists)
      .where(and(eq(lists.userId, anonymousUserId), eq(lists.type, 'custom')))
      .orderBy(asc(lists.position), desc(lists.createdAt));
    if (source.length === 0) {
      return;
    }
    const position = await nextPosition(
      tx,
      lists,
      and(eq(lists.userId, accountUserId), eq(lists.type, 'custom')),
    );
    for (const [offset, item] of source.entries()) {
      await tx
        .update(lists)
        .set({
          userId: accountUserId,
          position: position + offset,
          updatedAt: sql`${lists.updatedAt}`,
        })
        .where(
          and(eq(lists.id, item.id), eq(lists.userId, anonymousUserId), eq(lists.type, 'custom')),
        );
    }
  });
}
