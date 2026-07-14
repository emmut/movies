#!/usr/bin/env tsx

/**
 * Downloads IMDb's daily ratings dataset and upserts it into the
 * imdb_ratings table.
 *
 * Usage:
 *   pnpm ingest:imdb
 *
 * Runs daily on Railway as the imdb-ingest cron service.
 *
 * Data: https://developer.imdb.com/non-commercial-datasets/ — licensed for
 * personal, non-commercial use only.
 */

import { Transform, type TransformCallback } from 'node:stream';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { parse } from 'csv-parse';
import { drizzle } from 'drizzle-orm/node-postgres';

import { env } from './env';
import {
  parseRatingRecord,
  upsertRatingsBatch,
  type ImdbRatingRow,
} from '@/lib/imdb-ingest';

const DATASET_URL = 'https://datasets.imdbws.com/title.ratings.tsv.gz';
const BATCH_SIZE = 5_000;
const PROGRESS_INTERVAL = 250_000;
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;

const db = drizzle({ connection: { connectionString: env.DATABASE_URL, max: 1 } });

function logProgress(total: number) {
  if (total % PROGRESS_INTERVAL === 0) {
    console.log(`   • ${total.toLocaleString('en-US')} ratings upserted`);
  }
}

function createRatingTransform() {
  let batch: ImdbRatingRow[] = [];
  let total = 0;

  async function flushBatch(callback: TransformCallback) {
    try {
      if (batch.length > 0) {
        await upsertRatingsBatch(db, batch);
        total += batch.length;
        batch = [];
      }
      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  return new Transform({
    objectMode: true,
    async transform(record: Record<string, string>, _encoding, callback) {
      const row = parseRatingRecord(record);
      if (!row) {
        callback();
        return;
      }

      batch.push(row);

      if (batch.length >= BATCH_SIZE) {
        logProgress(total);
        await flushBatch(callback);
        return;
      }

      callback();
    },
    async flush(callback) {
      await flushBatch(callback);
      console.log(`✅ Done: ${total.toLocaleString('en-US')} ratings upserted`);
    },
  });
}

async function main() {
  console.log(`📥 Downloading ${DATASET_URL}...`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(DATASET_URL, { signal: controller.signal });
    if (!response.ok || !response.body) {
      throw new Error(
        `Failed downloading ${DATASET_URL}: ${response.status} ${response.statusText}`,
      );
    }

    const nodeStream = Readable.fromWeb(
      response.body as NodeReadableStream<Uint8Array>,
    );

    const gunzipped = nodeStream.pipe(createGunzip());

    const parser = parse({
      delimiter: '\t',
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    });

    const ratingTransform = createRatingTransform();

    await pipeline(gunzipped, parser, ratingTransform);
  } finally {
    clearTimeout(timeout);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
