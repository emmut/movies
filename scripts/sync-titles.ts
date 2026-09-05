#!/usr/bin/env tsx

/**
 * Refreshes the local title cache — `titles`, `title_availability` — for every
 * movie and TV show that appears in any list, then prunes titles no list
 * references any more.
 *
 * Usage:
 *   pnpm sync:titles
 *
 * Runs nightly on Railway as the title-sync cron service. Titles are also
 * written through when added to a list, so this job's work is refreshing
 * stale rows (availability daily, details weekly) and catching anything the
 * write-through missed.
 *
 * Data: TMDB API — https://www.themoviedb.org/api-terms-of-use. Watch
 * provider data is supplied by JustWatch and must be attributed as such.
 */

import {
  AVAILABILITY_MAX_AGE_MS,
  mapWithConcurrency,
  pruneOrphanTitles,
  selectTitlesNeedingAvailability,
  selectTitlesNeedingDetails,
  staleBefore,
  syncTitleAvailability,
  syncTitleDetails,
  TITLE_DETAILS_MAX_AGE_MS,
  type TitleKey,
  type TitleSource,
} from '@/lib/title-sync';
import { createTmdbFetch } from '@/lib/tmdb-fetch';

import { connectForCron } from './cron-db';
import { describeError } from './describe-error';
import { env } from './env';

// TMDB's unofficial ceiling is ~50 requests/s; a handful in flight keeps a
// multi-thousand-title working set to a few minutes without brushing it.
const CONCURRENCY = 4;

if (!env.TITLE_SYNC_ENABLED) {
  console.log('⏭️ TITLE_SYNC_ENABLED is not set; nothing to do in this environment.');
  process.exit(0);
}

if (!env.MOVIE_DB_ACCESS_TOKEN) {
  console.error('❌ Missing MOVIE_DB_ACCESS_TOKEN in environment.');
  process.exit(1);
}

const tmdbFetch = createTmdbFetch(env.MOVIE_DB_ACCESS_TOKEN);

const source: TitleSource = {
  movieDetails: (id) => tmdbFetch(`/movie/${id}`),
  tvDetails: (id) => tmdbFetch(`/tv/${id}`),
  movieWatchProviders: (id) => tmdbFetch(`/movie/${id}/watch/providers`),
  tvWatchProviders: (id) => tmdbFetch(`/tv/${id}/watch/providers`),
};

type Tally = { synced: number; gone: number; failed: number };

/**
 * Syncs each title, tallying outcomes. A single failing title is logged and
 * skipped rather than aborting the run; it stays stale and is retried next
 * night.
 */
async function syncAll(
  label: string,
  keys: TitleKey[],
  sync: (key: TitleKey) => Promise<'synced' | 'gone'>,
): Promise<Tally> {
  const tally: Tally = { synced: 0, gone: 0, failed: 0 };
  console.log(`🔄 ${label}: ${keys.length.toLocaleString('en-US')} titles`);

  await mapWithConcurrency(keys, CONCURRENCY, async (key) => {
    try {
      tally[await sync(key)]++;
    } catch (error) {
      tally.failed++;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`   ⚠️ ${key.mediaType} ${key.tmdbId}: ${message}`);
    }
  });

  console.log(`   • ${tally.synced} synced, ${tally.gone} gone from TMDB, ${tally.failed} failed`);
  return tally;
}

async function main() {
  const db = await connectForCron(env.DATABASE_URL, CONCURRENCY);
  const now = new Date();

  const details = await syncAll(
    'Details',
    await selectTitlesNeedingDetails(db, {
      staleBefore: staleBefore(TITLE_DETAILS_MAX_AGE_MS, now),
    }),
    (key) => syncTitleDetails(db, source, key),
  );

  const availability = await syncAll(
    'Availability',
    await selectTitlesNeedingAvailability(db, {
      staleBefore: staleBefore(AVAILABILITY_MAX_AGE_MS, now),
    }),
    (key) => syncTitleAvailability(db, source, key),
  );

  const pruned = await pruneOrphanTitles(db);
  if (pruned.titles > 0 || pruned.availability > 0) {
    console.log(
      `🧹 Pruned ${pruned.titles} titles and ${pruned.availability} availability sets no list references`,
    );
  }

  await db.$client.end();

  const failed = details.failed + availability.failed;
  if (failed > 0) {
    console.error(`❌ Done with ${failed} failures`);
    process.exit(1);
  }
  console.log('✅ Done');
}

main().catch((error) => {
  console.error('❌ Error:', describeError(error));
  process.exit(1);
});
