import 'server-only';
import { selectWatchProviders } from '@movies/api/preferences';
import type { SystemListService } from '@movies/api/router';
import { fulfilledValues } from '@movies/api/settled';
import { parseWatchProviderFilter, type SystemListToggleInput } from '@movies/api/system-lists';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import type { MovieDetails } from '@movies/api/tmdb-types/movie';
import type { TvDetails } from '@movies/api/tmdb-types/tv-show';
import { ITEMS_PER_PAGE } from '@movies/config/constants';
import { createListItemOrderingStore, ListItemNotFoundError } from '@movies/db/list-item-order';
import { createSystemListStore } from '@movies/db/system-lists';
import { ensureTitleAvailability } from '@movies/db/title-availability';
import { syncTitle, type TitleSource } from '@movies/db/title-sync';
import { createUserPreferenceStore } from '@movies/db/user-preferences';
import { ORPCError } from '@orpc/server';
import { requireDatabase, type Database } from '@server/database';
import { tmdbCardSchema, toMediaCard } from '@server/media-card';
import { readWatchProviders, toProviderChoices } from '@server/watch-provider-options';

function titleSource(fetchTmdb: TmdbFetch): TitleSource {
  return {
    movieDetails: (id) => fetchTmdb<MovieDetails>('/movie/' + id),
    tvDetails: (id) => fetchTmdb<TvDetails>('/tv/' + id),
    movieWatchProviders: (id) => fetchTmdb('/movie/' + id + '/watch/providers'),
    tvWatchProviders: (id) => fetchTmdb('/tv/' + id + '/watch/providers'),
  };
}

const unavailable = requireDatabase('System lists');

/** Same account rows, ordering locks and title cache as web; no Next action imports. */
export function createSystemListService(
  database: Database | undefined,
  fetchTmdb: TmdbFetch,
  reportSyncError: (error: unknown, input: SystemListToggleInput) => void,
): SystemListService {
  if (!database) {
    return {
      options: unavailable,
      page: unavailable,
      memberships: unavailable,
      toggle: unavailable,
      move: unavailable,
    };
  }
  const store = createSystemListStore(database);
  const order = createListItemOrderingStore(database);
  const source = titleSource(fetchTmdb);
  const preferences = createUserPreferenceStore(database);

  /** TMDB card for a list row; rejects when TMDB answers for a different title. */
  async function hydrateCard(
    row: { id: string; resourceId: number },
    resourceType: 'movie' | 'tv',
  ) {
    const raw = tmdbCardSchema.parse(await fetchTmdb('/' + resourceType + '/' + row.resourceId));
    if (raw.id !== row.resourceId) {
      throw new Error('Unexpected title identifier');
    }
    return { ...toMediaCard(raw, resourceType), listItemId: row.id };
  }

  return {
    async options(userId, input) {
      const [records, saved] = await Promise.all([
        readWatchProviders(fetchTmdb, 'movie', input.region),
        preferences.readProviders(userId),
      ]);
      return toProviderChoices(selectWatchProviders(records, saved));
    },
    async page(userId, input) {
      const filter = parseWatchProviderFilter(input.providerIds, input.region);
      const [rows, movie, tv] = await Promise.all([
        store.pageRows(userId, input.listType, input.resourceType, input.page, filter, (scope) =>
          ensureTitleAvailability(database, source, scope),
        ),
        store.countItems(userId, input.listType, 'movie'),
        store.countItems(userId, input.listType, 'tv'),
      ]);
      const items = await fulfilledValues(rows.items, (row) =>
        hydrateCard(row, input.resourceType),
      );
      return {
        ...rows,
        itemsPerPage: ITEMS_PER_PAGE,
        items,
        counts: { movie, tv },
        unavailableItems: rows.items.length - items.length,
      };
    },
    async memberships(userId, input) {
      const [inWatchlist, watched] = await Promise.all([
        store.membership(userId, 'watchlist', input.resourceId, input.resourceType),
        store.membership(userId, 'watched', input.resourceId, input.resourceType),
      ]);
      return { inWatchlist, watched };
    },
    async toggle(userId, input) {
      const action = await store.toggleSystemListRow(
        userId,
        input.listType,
        input.resourceId,
        input.resourceType,
      );
      if (action === 'added') {
        try {
          await syncTitle(database, source, {
            mediaType: input.resourceType,
            tmdbId: input.resourceId,
          });
        } catch (error) {
          // The list write succeeded; provider reads retry unknown availability and cron repairs it.
          reportSyncError(error, input);
        }
      }
      return { action };
    },
    async move(userId, input) {
      try {
        await order.move(userId, input);
      } catch (error) {
        if (error instanceof ListItemNotFoundError) {
          throw new ORPCError('NOT_FOUND');
        }
        throw error;
      }
      return { success: true };
    },
  };
}
