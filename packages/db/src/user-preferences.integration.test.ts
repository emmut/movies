import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createUserPreferenceStore } from './user-preferences';

// Runs against a migrated PostgreSQL database. A temporary "user" table shadows
// the real one for this connection, so fixtures never touch existing accounts.
describe.skipIf(!process.env.PREFERENCES_TEST_DATABASE_URL)('PostgreSQL user preferences', () => {
  const client = new Client({ connectionString: process.env.PREFERENCES_TEST_DATABASE_URL });
  const store = createUserPreferenceStore(drizzle(client));

  beforeAll(async () => {
    await client.connect();
    await client.query('CREATE TEMP TABLE "user" (LIKE public."user" INCLUDING DEFAULTS)');
    await client.query(
      `INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at, region)
       VALUES ('stored', 'Stored', 'stored@example.com', false, now(), now(), 'NO'),
              ('unset', 'Unset', 'unset@example.com', false, now(), now(), NULL)`,
    );
  });
  afterAll(async () => {
    await client.end();
  });

  it('reads the stored region and defaults an unset one to Sweden', async () => {
    expect(await store.readRegion('stored')).toBe('NO');
    expect(await store.readRegion('unset')).toBe('SE');
  });
  it('writes only the given account and reports unknown accounts', async () => {
    expect(await store.writeRegion('unset', 'DK')).toBe('DK');
    expect(await store.readRegion('unset')).toBe('DK');
    expect(await store.readRegion('stored')).toBe('NO');
    await expect(store.writeRegion('missing', 'US')).rejects.toThrow('User not found');
  });
});
