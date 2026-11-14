import { randomUUID } from 'node:crypto';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import {
  createCustomListStore,
  CustomListNotFoundError,
  CustomListConflictError,
} from './custom-lists';
import { createListItemOrderingStore, ListItemNotFoundError } from './list-item-order';

describe.skipIf(!process.env.CUSTOM_LIST_TEST_DATABASE_URL)(
  'PostgreSQL custom lists shared by web and Hono',
  () => {
    const schema = 'custom_list_test_' + randomUUID().replaceAll('-', '');
    const clients = [0, 1].map(
      () => new Client({ connectionString: process.env.CUSTOM_LIST_TEST_DATABASE_URL }),
    );
    const catchup = vi.fn().mockResolvedValue(0);
    const stores = clients.map((client) => createCustomListStore(drizzle(client), catchup));
    const orders = clients.map((client) => createListItemOrderingStore(drizzle(client)));
    let listId: string;
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
        `INSERT INTO "user" (id,name,email) VALUES ('one','One','one@test.invalid'),('two','Two','two@test.invalid')`,
      );
      listId = (await stores[0].create('one', 'Mixed favorites', 'Description', '🎬')).listId;
    });
    afterAll(async () => {
      try {
        await clients[0].query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      } finally {
        await Promise.all(clients.map((client) => client.end()));
      }
    });
    it('shares metadata, count and status without leaking another account', async () => {
      expect(await stores[1].owned('one', listId)).toEqual({ id: listId });
      expect(await stores[1].owned('two', listId)).toBeNull();
      expect(await stores[1].total('one')).toBe(1);
      expect((await stores[1].status('one', 42, 'movie'))[0]).toMatchObject({
        hasItem: false,
        itemCount: 0,
      });
      expect(await stores[1].index('two')).toMatchObject({ lists: [], totalItems: 0 });
      await stores[1].update('one', listId, 'Updated', 'New description', '⭐');
      expect((await stores[0].index('one')).lists[0]).toMatchObject({
        name: 'Updated',
        description: 'New description',
        emoji: '⭐',
        itemCount: 0,
      });
    });
    it('serializes concurrent appends while retaining mixed resource identities', async () => {
      await Promise.all([
        stores[0].add('one', listId, 1, 'movie'),
        stores[1].add('one', listId, 1, 'tv'),
      ]);
      await stores[0].add('one', listId, 1, 'person');
      const page = await stores[1].pageRows('one', listId);
      expect(page.items.map((item) => item.position)).toEqual([1, 2, 3]);
      expect(page.items.map((item) => item.resourceType).sort()).toEqual(['movie', 'person', 'tv']);
      expect((await stores[1].status('one', 1, 'person'))[0]).toMatchObject({
        id: listId,
        hasItem: true,
        itemCount: 3,
      });
      await expect(stores[1].add('one', listId, 1, 'movie')).rejects.toBeInstanceOf(
        CustomListConflictError,
      );
      expect(await stores[1].status('two', 1, 'movie')).toEqual([]);
    });
    it('rejects foreign, missing and system list writes and reads', async () => {
      const id = randomUUID();
      await clients[0].query(
        `INSERT INTO lists (id,user_id,name,type) VALUES ($1,'one','Watchlist','watchlist')`,
        [id],
      );
      for (const [user, target] of [
        ['two', listId],
        ['one', id],
        ['one', randomUUID()],
      ]) {
        await expect(stores[0].pageRows(user, target)).rejects.toBeInstanceOf(
          CustomListNotFoundError,
        );
        await expect(stores[0].add(user, target, 10, 'movie')).rejects.toBeInstanceOf(
          CustomListNotFoundError,
        );
        await expect(stores[0].remove(user, target, 1, 'movie')).rejects.toBeInstanceOf(
          CustomListNotFoundError,
        );
        await expect(stores[0].update(user, target, 'Wrong')).rejects.toBeInstanceOf(
          CustomListNotFoundError,
        );
        await expect(stores[0].delete(user, target)).rejects.toBeInstanceOf(
          CustomListNotFoundError,
        );
        await expect(stores[0].move(user, target, 0)).rejects.toBeInstanceOf(
          CustomListNotFoundError,
        );
      }
      expect(await stores[0].total('one')).toBe(1);
    });
    it('counts and pages before hydration and moves mixed items across page boundaries', async () => {
      for (let id = 2; id <= 19; id++) {
        await stores[0].add('one', listId, id, 'movie');
      }
      const last = await stores[1].pageRows('one', listId, 999);
      expect(last).toMatchObject({ currentPage: 2, totalPages: 2, totalItems: 21, itemCount: 21 });
      expect(last.items).toHaveLength(1);
      const item = last.items[0];
      await orders[1].move('one', { itemId: item.id, position: 0, listType: 'custom' });
      expect((await stores[0].pageRows('one', listId)).items[0].id).toBe(item.id);
      await expect(
        orders[0].move('two', { itemId: item.id, position: 0, listType: 'custom' }),
      ).rejects.toBeInstanceOf(ListItemNotFoundError);
      await expect(
        orders[0].move('one', { itemId: item.id, position: 0, listType: 'watchlist' }),
      ).rejects.toBeInstanceOf(ListItemNotFoundError);
    });
    it('filters stream/free offers in the selected region and retains the full count', async () => {
      await clients[0].query(
        `INSERT INTO title_availability (media_type,tmdb_id,region,provider_id,offer_type) VALUES ('movie',1,'NO',8,'flatrate'),('tv',1,'NO',8,'rent'),('movie',2,'SE',8,'free')`,
      );
      const filtered = await stores[0].pageRows('one', listId, 99, {
        region: 'NO',
        providerIds: [8],
      });
      expect(filtered).toMatchObject({ itemCount: 21, totalItems: 1, currentPage: 1 });
      expect(filtered.items.map((item) => item.resourceType)).toEqual(['movie']);
      expect(catchup).toHaveBeenCalled();
      catchup.mockRejectedValueOnce(new Error('availability unavailable'));
      await expect(
        stores[0].pageRows('one', listId, 1, { region: 'NO', providerIds: [8] }),
      ).rejects.toThrow('availability unavailable');
    });
    it('serializes concurrent list creates/moves and exposes changes across consumers', async () => {
      const created = await Promise.all([
        stores[0].create('one', 'A'),
        stores[1].create('one', 'B'),
      ]);
      const rows = await clients[0].query(
        `SELECT position FROM lists WHERE user_id='one' AND type='custom' ORDER BY position`,
      );
      expect(rows.rows.map((row) => row.position)).toEqual([1, 2, 3]);
      await Promise.all([
        stores[0].move('one', created[0].listId, 0),
        stores[1].move('one', created[1].listId, 0),
      ]);
      const after = await clients[0].query(
        `SELECT position FROM lists WHERE user_id='one' AND type='custom' ORDER BY position`,
      );
      expect(after.rows.map((row) => row.position)).toEqual([1, 2, 3]);
      await stores[1].remove('one', listId, 1, 'person');
      expect(
        (await stores[0].status('one', 1, 'person')).find((row) => row.id === listId)?.hasItem,
      ).toBe(false);
      await stores[1].delete('one', listId);
      expect(await stores[0].owned('one', listId)).toBeNull();
    });
  },
);
