import {
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * Local cache of the TMDB titles that appear in at least one list — the
 * "working set". TMDB stays the source of truth; these rows exist so list
 * pages can sort, filter, and count in SQL instead of fanning out one TMDB
 * request per row. Written through when a title is added to a list and
 * refreshed by the nightly `sync:titles` job, which also prunes titles no
 * list references any more.
 */
export const titles = pgTable(
  'titles',
  {
    tmdbId: integer('tmdb_id').notNull(),
    mediaType: text('media_type', { enum: ['movie', 'tv'] }).notNull(),
    title: text('title').notNull(),
    posterPath: text('poster_path'),
    // ISO date as TMDB reports it (release_date / first_air_date); null when
    // TMDB has none.
    releaseDate: text('release_date'),
    voteAverage: real('vote_average').notNull(),
    // Minutes; movies use runtime, TV the first episode_run_time entry.
    runtime: integer('runtime'),
    genreIds: integer('genre_ids').array().notNull(),
    fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.mediaType, table.tmdbId] })],
);

/**
 * Records that a title's streaming availability has been fetched from TMDB —
 * one row per title regardless of how many regions or offers came back, so a
 * title with no offers anywhere is still "known" and never re-fetched on
 * render. Independent of `titles`: a title deleted from TMDB has no details
 * to store but still needs this marker, otherwise every filtered page render
 * would retry it.
 */
export const titleAvailabilitySyncs = pgTable(
  'title_availability_syncs',
  {
    tmdbId: integer('tmdb_id').notNull(),
    mediaType: text('media_type', { enum: ['movie', 'tv'] }).notNull(),
    syncedAt: timestamp('synced_at').defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.mediaType, table.tmdbId] })],
);

/**
 * One row per (title, region, provider, offer type) — the offers TMDB (via
 * JustWatch) reports for every region the app supports. The stream-provider
 * filter on list pages is an EXISTS against this table; the primary key's
 * column order serves that lookup.
 */
export const titleAvailability = pgTable(
  'title_availability',
  {
    tmdbId: integer('tmdb_id').notNull(),
    mediaType: text('media_type', { enum: ['movie', 'tv'] }).notNull(),
    region: text('region').notNull(),
    providerId: integer('provider_id').notNull(),
    offerType: text('offer_type', { enum: ['flatrate', 'free', 'rent', 'buy'] }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.mediaType, table.tmdbId, table.region, table.providerId, table.offerType],
    }),
    // Offers live and die with their sync marker: replacing a title's
    // availability deletes the marker's offers and inserts the fresh set.
    foreignKey({
      columns: [table.mediaType, table.tmdbId],
      foreignColumns: [titleAvailabilitySyncs.mediaType, titleAvailabilitySyncs.tmdbId],
      name: 'title_availability_sync_fk',
    }).onDelete('cascade'),
  ],
);
