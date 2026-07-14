#!/usr/bin/env tsx

/**
 * Downloads IMDb's daily ratings dataset and upserts it into the
 * imdb_ratings table.
 *
 * Usage:
 *   pnpm ingest:imdb
 *
 * Runs daily on Railway as the imdb-ingest cron service. Only DATABASE_URL is
 * required, so the script builds its own pool instead of importing @/lib/db
 * (whose @/env schema demands the full app secret set).
 *
 * Data: https://developer.imdb.com/non-commercial-datasets/ — licensed for
 * personal, non-commercial use only.
 */

import { createInterface } from 'node:readline';
import { Readable, pipeline } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { createGunzip } from 'node:zlib';
import { drizzle } from 'drizzle-orm/node-postgres';

import { parseRatingLine, upsertRatingsBatch, type ImdbRatingRow } from '@/lib/imdb-ingest';

const DATASET_URL = 'https://datasets.imdbws.com/title.ratings.tsv.gz';
const BATCH_SIZE = 5_000;
const PROGRESS_INTERVAL = 250_000;
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  return drizzle({ connection: { connectionString, max: 1 } });
}

async function openDatasetStream() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    const response = await fetch(DATASET_URL, { signal: controller.signal });
    if (!response.ok || !response.body) {
      throw new Error(
        `Failed downloading ${DATASET_URL}: ${response.status} ${response.statusText}`,
      );
    }
    // fetch types the body as a DOM ReadableStream; Readable.fromWeb wants Node's.
    return Readable.fromWeb(response.body as NodeReadableStream<Uint8Array>).pipe(createGunzip());
  } finally {
    clearTimeout(timeout);
  }
}

function logProgress(total: number) {
  if (total % PROGRESS_INTERVAL === 0) {
    console.log(`   • ${total.toLocaleString('en-US')} ratings upserted`);
  }
}

async function main() {
  console.log(`📥 Downloading ${DATASET_URL}...`);
  const db = createDb();
  const lines = createInterface({ input: await openDatasetStream(), crlfDelay: Infinity });

  let batch: ImdbRatingRow[] = [];
  let total = 0;

  for await (const line of lines) {
    const row = parseRatingLine(line);
    if (!row) {
      continue;
    }

    batch.push(row);
    if (batch.length >= BATCH_SIZE) {
      await upsertRatingsBatch(db, batch);
      total += batch.length;
      batch = [];
      logProgress(total);
    }
  }

  await upsertRatingsBatch(db, batch);
  total += batch.length;

  console.log(`✅ Done: ${total.toLocaleString('en-US')} ratings upserted`);
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
