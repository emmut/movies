import 'server-only';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { transferCustomListOwnership } from './custom-list-transfer';
import { createSystemListStore } from './system-lists';

/** Better Auth only deletes the guest after this promise resolves. Every stage supports retry. */
export function createAnonymousAccountTransfer(db: NodePgDatabase) {
  const systemLists = createSystemListStore(db);
  return async function transfer(anonymousUserId: string, accountUserId: string) {
    if (anonymousUserId === accountUserId) {
      return;
    }
    await systemLists.transferSystemListItems(anonymousUserId, accountUserId);
    await transferCustomListOwnership(db, anonymousUserId, accountUserId);
  };
}
