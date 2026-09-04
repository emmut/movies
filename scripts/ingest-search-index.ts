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
  SEARCH_INDEX_EXPORTS,
  type SearchIndexExport,
} from '@/lib/search-index-ingest';

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
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  for (const exportFile of SEARCH_INDEX_EXPORTS) {
    await ingestExport(exportFile);
  }

  const stale = await deleteStaleSearchIndexRows(db);
  if (stale > 0) {
    console.log(`🧹 Pruned ${stale.toLocaleString('en-US')} rows gone from the exports`);
  }

  await db.$client.end();
  console.log('✅ Done');
}

// Same tail as every script in this folder; a shared runner would be more
// ceremony than the seven lines it saves.
// fallow-ignore-next-line code-duplication
main().catch((error) => {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
