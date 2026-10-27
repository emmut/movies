import { randomUUID } from 'node:crypto';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { createUserPreferenceStore } from './user-preferences';

// A private schema cloned from the migrated tables permits real concurrent connections.
// Its rows and constraints never touch existing user/provider records.
describe.skipIf(!process.env.PREFERENCES_TEST_DATABASE_URL)(
  'PostgreSQL provider preferences',
  () => {
    const schema = 'preference_test_' + randomUUID().replaceAll('-', '');
    const clients = [
      new Client({ connectionString: process.env.PREFERENCES_TEST_DATABASE_URL }),
      new Client({ connectionString: process.env.PREFERENCES_TEST_DATABASE_URL }),
    ];
    const stores = clients.map((client) => createUserPreferenceStore(drizzle(client)));
    beforeAll(async () => {
      await Promise.all(clients.map((client) => client.connect()));
      await clients[0].query(`CREATE SCHEMA "${schema}"`);
      await clients[0].query(`CREATE TABLE "${schema}"."user" (LIKE public."user" INCLUDING ALL)`);
      await clients[0].query(
        `CREATE TABLE "${schema}".user_watch_providers (LIKE public.user_watch_providers INCLUDING ALL)`,
      );
      await Promise.all(
        clients.map((client) => client.query(`SET search_path TO "${schema}", public`)),
      );
      await clients[0].query(
        `INSERT INTO "user" (id, name, email) VALUES ('one', 'One', 'one@test.invalid'), ('two', 'Two', 'two@test.invalid')`,
      );
      await clients[0].query(
        'ALTER TABLE user_watch_providers ADD CONSTRAINT test_provider_positive CHECK (provider_id > 0)',
      );
    });
    afterAll(async () => {
      try {
        await clients[0].query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      } finally {
        await Promise.all(clients.map((client) => client.end()));
      }
    });
    it('replaces, deduplicates and clears only the verified account selection', async () => {
      await stores[0].writeProviders('two', [337]);
      expect(await stores[0].writeProviders('one', [9, 8, 9])).toEqual([8, 9]);
      expect(await stores[0].readProviders('one')).toEqual([8, 9]);
      await stores[0].writeProviders('one', [8]);
      expect(await stores[0].readProviders('one')).toEqual([8]);
      await stores[0].writeProviders('one', []);
      expect(await stores[0].readProviders('one')).toEqual([]);
      expect(await stores[0].readProviders('two')).toEqual([337]);
      await expect(stores[0].writeProviders('missing', [])).rejects.toThrow('User not found');
    });
    it('rolls back a replacement if its insert fails', async () => {
      await stores[0].writeProviders('one', [8]);
      await expect(stores[0].writeProviders('one', [-1])).rejects.toThrow();
      expect(await stores[0].readProviders('one')).toEqual([8]);
    });
    it('serializes competing complete selections instead of merging or losing both', async () => {
      await Promise.all([
        stores[0].writeProviders('one', [8, 9]),
        stores[1].writeProviders('one', [337]),
      ]);
      const result = await stores[0].readProviders('one');
      expect([[8, 9], [337]]).toContainEqual(result);
      expect(await stores[0].readProviders('two')).toEqual([337]);
    });
  },
);
