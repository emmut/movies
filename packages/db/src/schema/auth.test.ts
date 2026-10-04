import { passkey as passkeyPlugin } from '@better-auth/passkey';
import { getAuthTables } from 'better-auth/db';
import { anonymous } from 'better-auth/plugins';
import { getTableColumns } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { account, passkey, session, user, verification } from './auth';

// better-auth reads and writes these tables through the Drizzle adapter, and it
// resolves them by field name at runtime — a field it expects but the schema
// lacks only surfaces as a failed query in production. Deriving the
// expectation from better-auth itself means the next upgrade that adds a field
// fails here instead of in the OAuth callback.
//
// History: better-auth 1.7.0–1.7.2 keyed accounts on (issuer, accountId) with
// a required `issuer` column; 1.7.3 reverted to the 1.6 (providerId,
// accountId) identity and no longer writes `issuer`, so the column and its
// unique index were removed again rather than relaxed to nullable.

// Mirrors the plugin list in src/lib/auth.ts, which can't be imported here
// because it opens a database pool. Plugins contribute their own tables
// (passkey) and extra columns (the anonymous plugin's user.isAnonymous), so
// passing them widens this check to the whole schema better-auth expects.
const authTables = getAuthTables({ plugins: [anonymous(), passkeyPlugin()] });

const TABLES = { user, session, account, verification, passkey };

describe('better-auth schema coverage', () => {
  for (const [model, table] of Object.entries(TABLES)) {
    it(`declares every field better-auth expects on "${model}"`, () => {
      const expected = Object.keys(authTables[model].fields);
      const actual = Object.keys(getTableColumns(table));

      expect(actual).toEqual(expect.arrayContaining(expected));
    });
  }
});
