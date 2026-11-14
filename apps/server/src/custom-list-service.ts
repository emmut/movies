import 'server-only';
import type { CustomListService } from '@movies/api/custom-lists';
import { fulfilledValues } from '@movies/api/settled';
import { parseWatchProviderFilter } from '@movies/api/system-lists';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { ITEMS_PER_PAGE, LISTS_PER_PAGE } from '@movies/config/constants';
import {
  createCustomListStore,
  CustomListNotFoundError,
  CustomListConflictError,
} from '@movies/db/custom-lists';
import { createListItemOrderingStore, ListItemNotFoundError } from '@movies/db/list-item-order';
import { ensureTitleAvailability } from '@movies/db/title-availability';
import { syncTitle } from '@movies/db/title-sync';
import { ORPCError } from '@orpc/server';
import { type Database, requireDatabase } from '@server/database';
import { tmdbCardSchema, toMediaCard, tmdbImageUrl } from '@server/media-card';
import { createTitleSource } from '@server/title-source';
import { personDetailsSchema } from '@server/tmdb-search-model';

type Dated = { createdAt: Date; updatedAt: Date };
function serializeDates<T extends Dated>(
  row: T,
): Omit<T, keyof Dated> & { createdAt: string; updatedAt: string } {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
function translateListError(error: unknown): never {
  if (error instanceof CustomListNotFoundError || error instanceof ListItemNotFoundError) {
    throw new ORPCError('NOT_FOUND');
  }
  if (error instanceof CustomListConflictError) {
    throw new ORPCError('CONFLICT');
  }
  throw error;
}
async function listOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    return translateListError(error);
  }
}

export function createCustomListService(
  database: Database | undefined,
  fetchTmdb: TmdbFetch,
  reportSyncError: (error: unknown) => void,
): CustomListService {
  if (!database) {
    const unavailable = requireDatabase('Custom lists');
    return {
      index: unavailable,
      details: unavailable,
      create: unavailable,
      update: unavailable,
      delete: unavailable,
      add: unavailable,
      remove: unavailable,
      status: unavailable,
      move: unavailable,
      moveItem: unavailable,
    };
  }
  const source = createTitleSource(fetchTmdb);
  const store = createCustomListStore(database, (scope) =>
    ensureTitleAvailability(database, source, scope),
  );
  const order = createListItemOrderingStore(database);
  async function hydrate(row: { id: string; resourceId: number; resourceType: string }) {
    if (row.resourceType === 'person') {
      const person = personDetailsSchema.parse(await fetchTmdb('/person/' + row.resourceId));
      if (person.id !== row.resourceId) {
        throw new Error('Unexpected person identifier');
      }
      return {
        type: 'person' as const,
        id: person.id,
        title: person.name,
        posterUrl: tmdbImageUrl(person.profile_path, 'w500'),
        listItemId: row.id,
      };
    }
    if (row.resourceType !== 'movie' && row.resourceType !== 'tv') {
      throw new Error('Unsupported list resource');
    }
    const raw = tmdbCardSchema.parse(
      await fetchTmdb('/' + row.resourceType + '/' + row.resourceId),
    );
    if (raw.id !== row.resourceId) {
      throw new Error('Unexpected title identifier');
    }
    return { ...toMediaCard(raw, row.resourceType), listItemId: row.id };
  }
  return {
    async index(userId, input) {
      const page = await store.index(userId, input.page);
      return { ...page, itemsPerPage: LISTS_PER_PAGE, lists: page.lists.map(serializeDates) };
    },
    async details(userId, input) {
      return listOperation(async () => {
        const rows = await store.pageRows(
          userId,
          input.listId,
          input.page,
          parseWatchProviderFilter(input.providerIds, input.region),
        );
        const items = await fulfilledValues(rows.items, hydrate);
        return {
          ...serializeDates(rows),
          itemsPerPage: ITEMS_PER_PAGE,
          items,
          unavailableItems: rows.items.length - items.length,
        };
      });
    },
    async create(userId, input) {
      return store.create(userId, input.name, input.description, input.emoji);
    },
    async update(userId, input) {
      await listOperation(() =>
        store.update(userId, input.listId, input.name, input.description, input.emoji),
      );
      return { success: true };
    },
    async delete(userId, input) {
      await listOperation(() => store.delete(userId, input.listId));
      return { success: true };
    },
    async add(userId, input) {
      await listOperation(() =>
        store.add(userId, input.listId, input.resourceId, input.resourceType),
      );
      if (input.resourceType !== 'person') {
        try {
          await syncTitle(database, source, {
            mediaType: input.resourceType,
            tmdbId: input.resourceId,
          });
        } catch (error) {
          reportSyncError(error);
        }
      }
      return { success: true };
    },
    async remove(userId, input) {
      await listOperation(() =>
        store.remove(userId, input.listId, input.resourceId, input.resourceType),
      );
      return { success: true };
    },
    async status(userId, input) {
      return (await store.status(userId, input.resourceId, input.resourceType)).map(serializeDates);
    },
    async move(userId, input) {
      await listOperation(() => store.move(userId, input.listId, input.position));
      return { success: true };
    },
    async moveItem(userId, input) {
      await listOperation(() => order.move(userId, { ...input, listType: 'custom' }));
      return { success: true };
    },
  };
}
