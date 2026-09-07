import { and, eq, inArray, isNull, lt, notExists, or, sql, SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgColumn } from 'drizzle-orm/pg-core';

import { listItems, lists } from '@/db/schema/lists';
import { titleAvailability, titleAvailabilitySyncs, titles } from '@/db/schema/titles';
import { getRegionCodes } from '@/lib/regions';
import type { MovieDetails } from '@/types/movie';
import type { TvDetails } from '@/types/tv-show';
import type { RegionWatchProviders } from '@/types/watch-provider';

import { TmdbRequestError } from './tmdb-fetch';

// No 'server-only' here: the nightly sync (scripts/sync-titles.ts) runs under
// tsx outside the Next.js server runtime and shares this module with the app.

export type TitleMediaType = 'movie' | 'tv';

export type TitleKey = {
  mediaType: TitleMediaType;
  tmdbId: number;
};

export type TitleRow = typeof titles.$inferInsert;
export type TitleAvailabilityRow = typeof titleAvailability.$inferInsert;

/** The `results` shape of TMDB's watch/providers endpoints, keyed by region. */
export type WatchProvidersByRegion = {
  results: Partial<Record<string, RegionWatchProviders>>;
};

/**
 * Where a sync reads TMDB data from. The app passes its `use cache` fetchers
 * (so a write-through right after a detail page rendered is served from the
 * entries that page filled); the nightly script passes a raw TMDB client.
 */
export type TitleSource = {
  movieDetails(tmdbId: number): Promise<MovieDetails>;
  tvDetails(tmdbId: number): Promise<TvDetails>;
  movieWatchProviders(tmdbId: number): Promise<WatchProvidersByRegion>;
  tvWatchProviders(tmdbId: number): Promise<WatchProvidersByRegion>;
};

export type SyncOutcome = 'synced' | 'gone';

type TitleSyncDatabase = NodePgDatabase;

const TITLE_MEDIA_TYPES: readonly TitleMediaType[] = ['movie', 'tv'];
const OFFER_TYPES = ['flatrate', 'free', 'rent', 'buy'] as const;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Refresh windows for the nightly job. Both sit a few hours short of a whole
// number of days so a row refreshed by last night's run is already stale for
// tonight's — a full 24h/7d would skip it and halve the effective cadence.
export const AVAILABILITY_MAX_AGE_MS = 20 * HOUR_MS;
export const TITLE_DETAILS_MAX_AGE_MS = 6 * DAY_MS + 20 * HOUR_MS;

export function isTitleMediaType(value: string): value is TitleMediaType {
  return TITLE_MEDIA_TYPES.includes(value as TitleMediaType);
}

/** The cut-off timestamp before which a row of the given max age counts as stale. */
export function staleBefore(maxAgeMs: number, now = new Date()) {
  return new Date(now.getTime() - maxAgeMs);
}

function emptyToNull(value: string | null | undefined) {
  return value ? value : null;
}

function positiveOrNull(value: number | null | undefined) {
  return value && value > 0 ? value : null;
}

/** Shapes TMDB movie details into a `titles` row. */
export function movieTitleRow(details: MovieDetails): TitleRow {
  return {
    mediaType: 'movie',
    tmdbId: details.id,
    title: details.title,
    posterPath: emptyToNull(details.poster_path),
    releaseDate: emptyToNull(details.release_date),
    voteAverage: details.vote_average ?? 0,
    runtime: positiveOrNull(details.runtime),
    genreIds: (details.genres ?? []).map((genre) => genre.id),
  };
}

/** Shapes TMDB TV details into a `titles` row. */
export function tvTitleRow(details: TvDetails): TitleRow {
  return {
    mediaType: 'tv',
    tmdbId: details.id,
    title: details.name,
    posterPath: emptyToNull(details.poster_path),
    releaseDate: emptyToNull(details.first_air_date),
    voteAverage: details.vote_average ?? 0,
    runtime: positiveOrNull(details.episode_run_time?.[0]),
    genreIds: (details.genres ?? []).map((genre) => genre.id),
  };
}

/**
 * Flattens a watch/providers response into `title_availability` rows for the
 * regions the app supports (one TMDB call covers every region). Duplicate
 * offers within a region are collapsed so the insert can't trip the primary
 * key.
 */
export function availabilityRows(
  key: TitleKey,
  response: WatchProvidersByRegion,
  regions: readonly string[] = getRegionCodes(),
): TitleAvailabilityRow[] {
  const rows: TitleAvailabilityRow[] = [];
  const seen = new Set<string>();

  for (const region of regions) {
    const offers = response.results?.[region];
    if (!offers) {
      continue;
    }
    for (const offerType of OFFER_TYPES) {
      for (const provider of offers[offerType] ?? []) {
        const dedupeKey = `${region}:${provider.provider_id}:${offerType}`;
        if (seen.has(dedupeKey)) {
          continue;
        }
        seen.add(dedupeKey);
        rows.push({ ...key, region, providerId: provider.provider_id, offerType });
      }
    }
  }

  return rows;
}

/** Inserts or refreshes a title's cached details, bumping `fetched_at`. */
export async function upsertTitle(database: TitleSyncDatabase, row: TitleRow) {
  await database
    .insert(titles)
    .values(row)
    .onConflictDoUpdate({
      target: [titles.mediaType, titles.tmdbId],
      set: {
        title: sql`excluded.title`,
        posterPath: sql`excluded.poster_path`,
        releaseDate: sql`excluded.release_date`,
        voteAverage: sql`excluded.vote_average`,
        runtime: sql`excluded.runtime`,
        genreIds: sql`excluded.genre_ids`,
        fetchedAt: sql`now()`,
      },
    });
}

/**
 * Replaces a title's availability with the given offers and stamps its sync
 * marker, atomically, so a filtered page never sees a half-written set.
 */
export async function replaceTitleAvailability(
  database: TitleSyncDatabase,
  key: TitleKey,
  rows: TitleAvailabilityRow[],
) {
  await database.transaction(async (tx) => {
    await tx
      .insert(titleAvailabilitySyncs)
      .values(key)
      .onConflictDoUpdate({
        target: [titleAvailabilitySyncs.mediaType, titleAvailabilitySyncs.tmdbId],
        set: { syncedAt: sql`now()` },
      });
    await tx
      .delete(titleAvailability)
      .where(
        and(
          eq(titleAvailability.mediaType, key.mediaType),
          eq(titleAvailability.tmdbId, key.tmdbId),
        ),
      );
    if (rows.length > 0) {
      await tx.insert(titleAvailability).values(rows);
    }
  });
}

function isGoneFromTmdb(error: unknown) {
  return error instanceof TmdbRequestError && error.status === 404;
}

/**
 * Fetches a title's details and upserts its `titles` row. A title TMDB no
 * longer has (404) is reported as `'gone'` and left without a row: there is
 * nothing to store, and the nightly job simply re-checks it.
 *
 * @throws Any other fetch or database failure.
 */
export async function syncTitleDetails(
  database: TitleSyncDatabase,
  source: TitleSource,
  key: TitleKey,
): Promise<SyncOutcome> {
  let row: TitleRow;
  try {
    row =
      key.mediaType === 'movie'
        ? movieTitleRow(await source.movieDetails(key.tmdbId))
        : tvTitleRow(await source.tvDetails(key.tmdbId));
  } catch (error) {
    if (isGoneFromTmdb(error)) {
      return 'gone';
    }
    throw error;
  }

  await upsertTitle(database, row);
  return 'synced';
}

/**
 * Fetches a title's watch providers and replaces its availability rows. A
 * title TMDB no longer has (404) streams nowhere: its empty set is recorded
 * and it is reported as `'gone'`, so filtered pages stop retrying it.
 *
 * @throws Any other fetch or database failure.
 */
export async function syncTitleAvailability(
  database: TitleSyncDatabase,
  source: TitleSource,
  key: TitleKey,
): Promise<SyncOutcome> {
  let rows: TitleAvailabilityRow[] = [];
  let outcome: SyncOutcome = 'synced';
  try {
    const response =
      key.mediaType === 'movie'
        ? await source.movieWatchProviders(key.tmdbId)
        : await source.tvWatchProviders(key.tmdbId);
    rows = availabilityRows(key, response);
  } catch (error) {
    if (!isGoneFromTmdb(error)) {
      throw error;
    }
    outcome = 'gone';
  }

  await replaceTitleAvailability(database, key, rows);
  return outcome;
}

/** Syncs both details and availability for one title. */
export async function syncTitle(database: TitleSyncDatabase, source: TitleSource, key: TitleKey) {
  await syncTitleDetails(database, source, key);
  await syncTitleAvailability(database, source, key);
}

function titleRowsInLists() {
  return inArray(listItems.resourceType, TITLE_MEDIA_TYPES);
}

function keyedToListItems(table: typeof titles | typeof titleAvailabilitySyncs) {
  return and(eq(table.mediaType, listItems.resourceType), eq(table.tmdbId, listItems.resourceId));
}

type WorkingSetOptions = {
  /** Only titles whose cached row is older than this (or missing). Omit for missing only. */
  staleBefore?: Date;
  /**
   * Narrows the list rows considered (e.g. one list, or one user's system
   * list). Rows are joined with `lists`, so the scope may reference both
   * `list_items` and `lists` columns.
   */
  scope?: SQL;
};

function missingOrStale(column: PgColumn, cutoff: Date | undefined) {
  return cutoff ? or(isNull(column), lt(column, cutoff)) : isNull(column);
}

async function selectWorkingSet(
  database: TitleSyncDatabase,
  table: typeof titles | typeof titleAvailabilitySyncs,
  freshnessColumn: PgColumn,
  { staleBefore: cutoff, scope }: WorkingSetOptions,
): Promise<TitleKey[]> {
  const rows = await database
    .selectDistinct({ mediaType: listItems.resourceType, tmdbId: listItems.resourceId })
    .from(listItems)
    .innerJoin(lists, eq(listItems.listId, lists.id))
    .leftJoin(table, keyedToListItems(table))
    .where(and(scope, titleRowsInLists(), missingOrStale(freshnessColumn, cutoff)));

  return rows as TitleKey[];
}

/** Distinct titles in any list whose details are missing or stale. */
export function selectTitlesNeedingDetails(
  database: TitleSyncDatabase,
  options: WorkingSetOptions,
) {
  return selectWorkingSet(database, titles, titles.fetchedAt, options);
}

/** Distinct titles in any list whose availability is missing or stale. */
export function selectTitlesNeedingAvailability(
  database: TitleSyncDatabase,
  options: WorkingSetOptions,
) {
  return selectWorkingSet(
    database,
    titleAvailabilitySyncs,
    titleAvailabilitySyncs.syncedAt,
    options,
  );
}

/**
 * Deletes cached titles and availability that no list references any more,
 * keeping the cache bounded by what users actually keep.
 *
 * @returns How many title and availability-marker rows were removed.
 */
export async function pruneOrphanTitles(database: TitleSyncDatabase) {
  const [prunedTitles, prunedAvailability] = await Promise.all([
    database
      .delete(titles)
      .where(notExists(referencingListItems(titles)))
      .returning({
        tmdbId: titles.tmdbId,
      }),
    database
      .delete(titleAvailabilitySyncs)
      .where(notExists(referencingListItems(titleAvailabilitySyncs)))
      .returning({ tmdbId: titleAvailabilitySyncs.tmdbId }),
  ]);

  return { titles: prunedTitles.length, availability: prunedAvailability.length };
}

function referencingListItems(table: typeof titles | typeof titleAvailabilitySyncs) {
  return sql`(select 1 from ${listItems} where ${listItems.resourceType} = ${table.mediaType} and ${listItems.resourceId} = ${table.tmdbId})`;
}

/**
 * Runs `fn` over `items` with at most `limit` in flight, preserving order in
 * the result. The first rejection rejects the whole call and stops workers
 * from picking up further items (in-flight ones still finish).
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  let failed = false;

  async function worker() {
    while (!failed && next < items.length) {
      const index = next++;
      try {
        results[index] = await fn(items[index]);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
