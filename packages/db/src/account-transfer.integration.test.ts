import { randomUUID } from 'node:crypto';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { anonymous } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { createAnonymousAccountTransfer } from './account-transfer';
import { createCustomListStore } from './custom-lists';
import * as authSchema from './schema/auth';
import { createSystemListStore } from './system-lists';

describe.skipIf(!process.env.ACCOUNT_LINK_TEST_DATABASE_URL)(
  'Better Auth anonymous list migration',
  () => {
    const schema = 'account_link_test_' + randomUUID().replaceAll('-', '');
    const client = new Client({ connectionString: process.env.ACCOUNT_LINK_TEST_DATABASE_URL });
    const db = drizzle(client);
    const transfer = createAnonymousAccountTransfer(db);
    const lists = createCustomListStore(db, async () => {
      throw new Error('Unexpected provider read');
    });
    const system = createSystemListStore(db);
    const origin = 'http://localhost:3456';
    const password = 'Temporary-parity-passphrase-1234';
    const auth = betterAuth({
      baseURL: origin,
      secret: 'local-account-migration-test-secret-32-characters',
      database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
      emailAndPassword: { enabled: true },
      logger: { disabled: true },
      plugins: [
        anonymous({
          onLinkAccount: async ({ anonymousUser, newUser }) => {
            await transfer(anonymousUser.user.id, newUser.user.id);
          },
        }),
      ],
    });
    beforeAll(async () => {
      await client.connect();
      await client.query(`CREATE SCHEMA "${schema}"`);
      for (const table of ['user', 'session', 'account', 'verification', 'lists', 'list_items']) {
        await client.query(
          `CREATE TABLE "${schema}"."${table}" (LIKE public."${table}" INCLUDING ALL)`,
        );
      }
      await client.query(`SET search_path TO "${schema}", public`);
      await client.query(
        'ALTER TABLE lists ADD FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE',
      );
      await client.query(
        'ALTER TABLE list_items ADD FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE',
      );
    });
    afterAll(async () => {
      try {
        await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      } finally {
        await client.end();
      }
    });
    async function request(path: string, body: Record<string, unknown>, cookie?: string) {
      const response = await auth.handler(
        new Request(origin + '/api/auth' + path, {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin, ...(cookie ? { cookie } : {}) },
          body: JSON.stringify(body),
        }),
      );
      const cookies = response.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ');
      const text = await response.text();
      return { response, data: text ? JSON.parse(text) : null, cookie: cookies };
    }
    async function guest() {
      const result = await request('/sign-in/anonymous', {});
      expect(result.response.status).toBe(200);
      return { ...result, id: result.data.user.id as string };
    }
    it('keeps custom movie/TV/person rows after Better Auth deletes a linked guest', async () => {
      const source = await guest();
      const list = await lists.create(source.id, 'Guest favorites', 'Retain this list', '⭐');
      for (const type of ['movie', 'tv', 'person'] as const) {
        await lists.add(source.id, list.listId, 1, type);
      }
      await system.toggleSystemListRow(source.id, 'watchlist', 42, 'movie');
      const result = await request(
        '/sign-up/email',
        { email: 'new-account@test.invalid', password, name: 'New account' },
        source.cookie,
      );
      expect(result.response.status).toBe(200);
      const accountId = result.data.user.id as string;
      expect(accountId).not.toBe(source.id);
      expect((await client.query('SELECT id FROM "user" WHERE id=$1', [source.id])).rows).toEqual(
        [],
      );
      expect(await lists.owned(accountId, list.listId)).toEqual({ id: list.listId });
      const detail = await lists.pageRows(accountId, list.listId);
      expect(detail.items.map((item) => item.resourceType)).toEqual(['movie', 'tv', 'person']);
      expect(detail).toMatchObject({ name: 'Guest favorites', emoji: '⭐', itemCount: 3 });
      expect(await system.membership(accountId, 'watchlist', 42, 'movie')).toBe(true);
    });
    it('appends intact guest lists to an existing account and tolerates a transfer retry', async () => {
      const existing = await request('/sign-up/email', {
        email: 'existing@test.invalid',
        password,
        name: 'Existing',
      });
      expect(existing.response.status).toBe(200);
      const accountId = existing.data.user.id as string;
      const first = await lists.create(accountId, 'Existing list');
      const source = await guest();
      const next = await lists.create(source.id, 'Guest list');
      await lists.add(source.id, next.listId, 7, 'person');
      const result = await request(
        '/sign-in/email',
        { email: 'existing@test.invalid', password },
        source.cookie,
      );
      expect(result.response.status).toBe(200);
      expect((await lists.index(accountId)).lists.map((list) => list.id)).toEqual([
        first.listId,
        next.listId,
      ]);
      await transfer(source.id, accountId);
      expect((await lists.index(accountId)).lists.map((list) => list.id)).toEqual([
        first.listId,
        next.listId,
      ]);
      expect((await lists.pageRows(accountId, next.listId)).items[0]).toMatchObject({
        resourceId: 7,
        resourceType: 'person',
      });
    });
    it('rolls back a failed custom transfer and prevents guest cleanup', async () => {
      const source = await guest();
      const first = await lists.create(source.id, 'First retained');
      const second = await lists.create(source.id, 'Fail migration');
      await lists.add(source.id, first.listId, 99, 'movie');
      await client.query(
        `CREATE FUNCTION reject_test_transfer() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF OLD.name='Fail migration' THEN RAISE EXCEPTION 'controlled transfer failure'; END IF; RETURN NEW; END $$`,
      );
      await client.query(
        'CREATE TRIGGER reject_test_transfer BEFORE UPDATE ON lists FOR EACH ROW EXECUTE FUNCTION reject_test_transfer()',
      );
      try {
        const result = await request(
          '/sign-up/email',
          { email: 'failed-link@test.invalid', password, name: 'Failed link' },
          source.cookie,
        );
        expect(result.response.status).toBe(500);
        expect(result.response.headers.getSetCookie()).toEqual([]);
        const retained = await auth.handler(
          new Request(origin + '/api/auth/get-session?disableCookieCache=true', {
            headers: { cookie: source.cookie, origin },
          }),
        );
        expect((await retained.json()).user.id).toBe(source.id);
        expect(
          (await client.query('SELECT id FROM "user" WHERE id=$1', [source.id])).rows,
        ).toHaveLength(1);
        expect(await lists.owned(source.id, first.listId)).toEqual({ id: first.listId });
        expect(await lists.owned(source.id, second.listId)).toEqual({ id: second.listId });
        expect((await lists.pageRows(source.id, first.listId)).itemCount).toBe(1);
      } finally {
        await client.query('DROP TRIGGER reject_test_transfer ON lists');
      }
    });
  },
);
