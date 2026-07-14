import { integer, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const imdbRatings = pgTable('imdb_ratings', {
  imdbId: text('imdb_id').primaryKey(),
  rating: numeric('rating', { precision: 3, scale: 1 }).notNull(),
  numVotes: integer('num_votes').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
