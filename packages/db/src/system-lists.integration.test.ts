import { randomUUID } from 'node:crypto';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { createListItemOrderingStore, ListItemNotFoundError } from './list-item-order';
import { createSystemListStore } from './system-lists';

describe.skipIf(!process.env.SYSTEM_LIST_TEST_DATABASE_URL)(
  'PostgreSQL shared system lists',
  () => {
    const schema = 'system_list_test_' + randomUUID().replaceAll('-', '');
    const clients = [
      new Client({ connectionString: process.env.SYSTEM_LIST_TEST_DATABASE_URL }),
      new Client({ connectionString: process.env.SYSTEM_LIST_TEST_DATABASE_URL }),
    ];
    const stores = clients.map((client) => createSystemListStore(drizzle(client)));
    const order = createListItemOrderingStore(drizzle(clients[0]));
    beforeAll(async () => {
      await Promise.all(clients.map((client) => client.connect()));
      await clients[0].query(`CREATE SCHEMA "${schema}"`);
      for (const table of ['user', 'lists', 'list_items', 'title_availability']) {
        await clients[0].query(
          `CREATE TABLE "${schema}"."${table}" (LIKE public."${table}" INCLUDING ALL)`,
        );
      }
      await Promise.all(
        clients.map((client) => client.query(`SET search_path TO "${schema}", public`)),
      );
      await clients[0].query(
        `INSERT INTO "user" (id, name, email) VALUES ('one','One','one@test.invalid'), ('two','Two','two@test.invalid')`,
      );
    });
    afterAll(async () => {
      try {
        await clients[0].query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      } finally {
        await Promise.all(clients.map((client) => client.end()));
      }
    });
    it('creates singleton lists under concurrent adds, with distinct scoped positions', async () => {
      await Promise.all([
        stores[0].toggleSystemListRow('one', 'watchlist', 1, 'movie'),
        stores[1].toggleSystemListRow('one', 'watchlist', 2, 'movie'),
      ]);
      const lists = await clients[0].query(
        `SELECT id FROM lists WHERE user_id='one' AND type='watchlist'`,
      );
      expect(lists.rows).toHaveLength(1);
      const positions = await clients[0].query(
        `SELECT position FROM list_items WHERE list_id=$1 ORDER BY position`,
        [lists.rows[0].id],
      );
      expect(positions.rows.map((row) => row.position)).toEqual([1, 2]);
      expect(await stores[0].membership('two', 'watchlist', 1, 'movie')).toBe(false);
    });
    it('toggles independently and preserves movie/TV scoped ordering across pages', async () => {
      await stores[0].toggleSystemListRow('one', 'watched', 1, 'movie');
      expect(await stores[0].membership('one', 'watchlist', 1, 'movie')).toBe(true);
      expect(await stores[0].membership('one', 'watched', 1, 'movie')).toBe(true);
      for (let id = 3; id <= 21; id += 1) {
        await stores[0].toggleSystemListRow('one', 'watchlist', id, 'movie');
      }
      await stores[0].toggleSystemListRow('one', 'watchlist', 1, 'tv');
      const second = await stores[0].pageRows('one', 'watchlist', 'movie', 2, null, vi.fn());
      expect(second.items).toHaveLength(1);
      expect(second.items[0].resourceId).toBe(21);
      await order.move('one', {
        listType: 'watchlist',
        resourceType: 'movie',
        itemId: second.items[0].id,
        position: 19,
      });
      const updated = await stores[0].pageRows('one', 'watchlist', 'movie', 2, null, vi.fn());
      expect(updated.items[0].resourceId).toBe(20);
      expect(await stores[0].countItems('one', 'watchlist', 'tv')).toBe(1);
      await expect(
        order.move('two', { itemId: updated.items[0].id, position: 0 }),
      ).rejects.toBeInstanceOf(ListItemNotFoundError);
      await expect(
        order.move('one', {
          listType: 'watched',
          resourceType: 'movie',
          itemId: updated.items[0].id,
          position: 0,
        }),
      ).rejects.toBeInstanceOf(ListItemNotFoundError);
    });
    it('filters streaming/free offers in SQL, clamps pages, and distinguishes sync failure from no matches', async () => {
      await clients[0].query(
        `INSERT INTO title_availability (media_type,tmdb_id,region,provider_id,offer_type) VALUES ('movie',1,'NO',8,'flatrate'), ('movie',2,'NO',8,'rent'), ('movie',3,'SE',8,'free')`,
      );
      const catchup = vi.fn().mockResolvedValue(0);
      const page = await stores[0].pageRows(
        'one',
        'watchlist',
        'movie',
        99,
        { region: 'NO', providerIds: [8] },
        catchup,
      );
      expect(page.items.map((row) => row.resourceId)).toEqual([1]);
      expect(page).toMatchObject({ currentPage: 1, totalItems: 1, totalPages: 1 });
      expect(catchup).toHaveBeenCalledOnce();
      await expect(
        stores[0].pageRows(
          'one',
          'watchlist',
          'movie',
          1,
          { region: 'NO', providerIds: [8] },
          async () => {
            throw new Error('upstream down');
          },
        ),
      ).rejects.toThrow('upstream down');
    });
    it('copies anonymous records to the linked account without duplicates or touching the source', async () => {
      await stores[0].transferSystemListItems('one', 'two');
      await stores[0].transferSystemListItems('one', 'two');
      expect(await stores[0].countItems('two', 'watchlist', 'movie')).toBe(21);
      expect(await stores[0].countItems('two', 'watchlist', 'tv')).toBe(1);
      expect(await stores[0].membership('two', 'watched', 1, 'movie')).toBe(true);
      expect(await stores[0].countItems('one', 'watchlist', 'movie')).toBe(21);
      expect(await stores[0].toggleSystemListRow('one', 'watchlist', 1, 'movie')).toBe('removed');
      expect(await stores[0].membership('two', 'watchlist', 1, 'movie')).toBe(true);
    });
  },
);
