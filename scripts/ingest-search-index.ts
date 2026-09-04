#!/usr/bin/env tsx

/**
 * Downloads TMDB's daily id exports (movies, TV series, people) and upserts
 * them into the search_index table, then prunes ids that stopped appearing.
 *
 * Usage:
 *   pnpm ingest:search
 *
 * Runs daily on Railway as the search-index-ingest cron service.
 *
 * Data: https://developer.themoviedb.org/docs/daily-id-exports — published by
 * TMDB for exactly this purpose (a full id list without crawling the API).
 * Each line carries only id, original title or name, popularity, and the
 * adult flag. Subject to TMDB's API terms; attribute TMDB where results show.
 */

import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { createGunzip } from 'node:zlib';
import { drizzle } from 'drizzle-orm/node-postgres';

import {
  deleteStaleSearchIndexRows,
  exportDates,
  exportFileUrl,
  ingestExportLines,
  isExportComplete,
  MIN_EXPORT_ROWS,
  SEARCH_INDEX_EXPORTS,
  type SearchIndexExport,
} from '@/lib/search-index-ingest';

import { describeError } from './describe-error';
import { env } from './env';

const BATCH_SIZE = 5_000;
const PROGRESS_INTERVAL = 250_000;
const DOWNLOAD_TIMEOUT_MS = 20 * 60 * 1000;

const db = drizzle({ connection: { connectionString: env.DATABASE_URL, max: 1 } });

/**
 * Opens today's export, falling back to yesterday's when today's is not
 * published yet (TMDB uploads by 08:00 UTC).
 */
async function openExport(file: SearchIndexExport['file'], signal: AbortSignal) {
  let lastStatus = '';
  for (const date of exportDates()) {
    const url = exportFileUrl(file, date);
    const response = await fetch(url, { signal });
    if (response.ok && response.body) {
      console.log(`📥 ${url}`);
      return response.body;
    }
    lastStatus = `${response.status} ${response.statusText}`;
  }
  throw new Error(`No export available for ${file} (last response: ${lastStatus})`);
}

async function ingestExport({ mediaType, file }: SearchIndexExport) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const body = await openExport(file, controller.signal);
    const lines = createInterface({
      input: Readable.fromWeb(body as NodeReadableStream<Uint8Array>).pipe(createGunzip()),
      crlfDelay: Infinity,
    });

    const { total, skipped } = await ingestExportLines(db, mediaType, lines, {
      batchSize: BATCH_SIZE,
      onProgress(count) {
        if (count % PROGRESS_INTERVAL === 0) {
          console.log(`   • ${count.toLocaleString('en-US')} ${mediaType} rows upserted`);
        }
      },
    });

    console.log(
      `✅ ${mediaType}: ${total.toLocaleString('en-US')} rows upserted, ${skipped.toLocaleString('en-US')} skipped (adult or malformed)`,
    );
    return total;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Prunes stale rows of one media type, but only when its export came back
 * complete. An empty or unparseable export leaves every existing row
 * untouched for that day; pruning it would delete the whole type a week
 * later while the job reported success.
 */
async function pruneIfComplete(mediaType: SearchIndexExport['mediaType'], total: number) {
  if (!isExportComplete(mediaType, total)) {
    console.error(
      `⚠️ ${mediaType}: only ${total.toLocaleString('en-US')} rows ingested (expected at least ${MIN_EXPORT_ROWS[mediaType].toLocaleString('en-US')}); skipping the stale-row prune for this type`,
    );
    return false;
  }

  const stale = await deleteStaleSearchIndexRows(db, mediaType);
  if (stale > 0) {
    console.log(`🧹 ${mediaType}: pruned ${stale.toLocaleString('en-US')} rows gone from the export`);
  }
  return true;
}

async function main() {
  let incomplete = 0;
  for (const exportFile of SEARCH_INDEX_EXPORTS) {
    const total = await ingestExport(exportFile);
    if (!(await pruneIfComplete(exportFile.mediaType, total))) {
      incomplete++;
    }
  }

  await db.$client.end();

  if (incomplete > 0) {
    console.error(`❌ Done with ${incomplete} incomplete export(s)`);
    process.exit(1);
  }
  console.log('✅ Done');
}

// Same tail as every script in this folder; a shared runner would be more
// ceremony than the seven lines it saves.
// fallow-ignore-next-line code-duplication
main().catch((error) => {
  console.error('❌ Error:', describeError(error));
  process.exit(1);
});
