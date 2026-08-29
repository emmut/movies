import { passkey as passkeyPlugin } from '@better-auth/passkey';
import { getAuthTables } from 'better-auth/db';
import { anonymous } from 'better-auth/plugins';
import { getTableColumns } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { account, passkey, session, user, verification } from './auth';

// better-auth reads and writes these tables through the Drizzle adapter, and it
// resolves them by field name at runtime — a field it expects but the schema
// lacks only surfaces as a failed query in production. That is how the
// `account.issuer` column added in better-auth 1.7 slipped through: social
// sign-in died on the account write ("The field \"issuer\" does not exist in
// the schema for the model \"account\""), while anonymous sign-in, which never
// writes an account row, kept working.
//
// Deriving the expectation from better-auth itself means the next upgrade that
// adds a field fails here instead of in the OAuth callback.

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

  it('namespaces account identities with an issuer', () => {
    // Not just any column: better-auth keys OAuth accounts on (issuer,
    // accountId), so the column has to be non-null for every existing row.
    const { issuer } = getTableColumns(account);

    expect(issuer).toBeDefined();
    expect(issuer.notNull).toBe(true);
  });
});
