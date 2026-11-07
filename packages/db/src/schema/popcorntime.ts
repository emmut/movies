import { date, index, integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

/** The last complete release imported for each country. */
export const popcorntimeSnapshots = pgTable('popcorntime_snapshots', {
  region: text('region').primaryKey(),
  version: text('version').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  importedAt: timestamp('imported_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Destinations only: TMDB remains the authority for regional availability. */
export const popcorntimeLinks = pgTable(
  'popcorntime_links',
  {
    mediaType: text('media_type', { enum: ['movie', 'tv'] }).notNull(),
    tmdbId: integer('tmdb_id').notNull(),
    region: text('region')
      .notNull()
      .references(() => popcorntimeSnapshots.region, { onDelete: 'cascade' }),
    providerId: integer('provider_id').notNull(),
    offerType: text('offer_type', { enum: ['flatrate', 'rent', 'buy', 'free', 'ads'] }).notNull(),
    linkToken: text('link_token').notNull(),
    availableFrom: date('available_from'),
    availableTo: date('available_to'),
  },
  (table) => [
    primaryKey({
      name: 'popcorntime_links_pk',
      columns: [table.mediaType, table.tmdbId, table.region, table.providerId, table.offerType],
    }),
    index('popcorntime_links_region_idx').on(table.region),
  ],
);
