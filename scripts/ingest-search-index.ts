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

import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { PassThrough, pipeline, Readable } from 'node:stream';
import { pipeline as pipelineAsync } from 'node:stream/promises';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { createGunzip } from 'node:zlib';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

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

import { connectForCron } from './cron-db';
import { describeError } from './describe-error';
import { env } from './env';

const BATCH_SIZE = 5_000;
const PROGRESS_INTERVAL = 250_000;
// Abort an export that makes no progress for this long, so a hung connection
// dies instead of waiting forever. The timer resets on every flushed batch:
// a slow but advancing ingest (the full catalog takes well over an hour at
// ~1k rows/s through the trigram index) runs to completion.
const STALL_TIMEOUT_MS = 5 * 60 * 1000;
// TMDB serves the exports from CloudFront, which drops a connection that
// sits idle too long. Retry the download a few times before giving up.
const DOWNLOAD_ATTEMPTS = 3;

if (!env.SEARCH_INDEX_INGEST_ENABLED) {
  console.log('⏭️ SEARCH_INDEX_INGEST_ENABLED is not set; nothing to do in this environment.');
  process.exit(0);
}

type DownloadOptions = {
  signal: AbortSignal;
  /** Called on every received chunk, so a stall timer can tell "slow" from "hung". */
  onChunk: () => void;
};

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

/**
 * Downloads an export to `destination` in one go, at network speed.
 *
 * Ingesting straight from the response body used to throttle the download
 * to the database's upsert rate (~1k rows/s through the trigram index), which
 * kept the socket open for the better part of an hour with long idle gaps —
 * and CloudFront closed it mid-body ("other side closed"). Buffering the
 * compressed file to disk first (tens of MB) takes seconds, so the connection
 * never idles, and a failed transfer can simply be retried.
 */
async function downloadExport(
  file: SearchIndexExport['file'],
  destination: string,
  options: DownloadOptions,
) {
  for (let attempt = 1; ; attempt++) {
    try {
      await saveExport(file, destination, options);
      return;
    } catch (error) {
      if (!canRetryDownload(attempt, options.signal)) {
        throw error;
      }
      console.error(
        `⚠️ ${file}: download attempt ${attempt} failed (${describeError(error)}); retrying`,
      );
    }
  }
}

/** A stall abort is final; anything else gets retried until the attempts run out. */
function canRetryDownload(attempt: number, signal: AbortSignal) {
  return !signal.aborted && attempt < DOWNLOAD_ATTEMPTS;
}

/** One download attempt: fetch the export and write it to `destination`. */
async function saveExport(
  file: SearchIndexExport['file'],
  destination: string,
  { signal, onChunk }: DownloadOptions,
) {
  const body = await openExport(file, signal);
  const progress = new PassThrough();
  progress.on('data', onChunk);
  await pipelineAsync(
    Readable.fromWeb(body as NodeReadableStream<Uint8Array>),
    progress,
    createWriteStream(destination),
    { signal },
  );
}

async function ingestExport(
  db: NodePgDatabase,
  { mediaType, file }: SearchIndexExport,
  workDir: string,
) {
  const controller = new AbortController();
  function stall() {
    controller.abort(
      new Error(
        `${mediaType}: no progress for ${STALL_TIMEOUT_MS / 60_000} minutes; aborting`,
      ),
    );
  }
  const timeout = setTimeout(stall, STALL_TIMEOUT_MS);
  const resetTimeout = () => timeout.refresh();

  try {
    const archive = join(workDir, `${file}.json.gz`);
    await downloadExport(file, archive, { signal: controller.signal, onChunk: resetTimeout });
    resetTimeout();

    // `.pipe()` does not forward errors, so a read failure used to crash the
    // process as an unhandled 'error' event on the source Readable.
    // `pipeline` wires error handling across both streams and destroys the
    // gunzip output with the error, which readline then surfaces as a
    // rejection of the line loop below.
    const source = pipeline(createReadStream(archive), createGunzip(), () => {});
    // The file read never hangs on its own; a stall here means the database
    // did. Destroying the source ends the line loop with the abort reason.
    controller.signal.addEventListener('abort', () => source.destroy(controller.signal.reason));
    const lines = createInterface({
      input: source,
      crlfDelay: Infinity,
    });

    const { total, skipped } = await ingestExportLines(db, mediaType, lines, {
      batchSize: BATCH_SIZE,
      onProgress(count) {
        resetTimeout();
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
async function pruneIfComplete(
  db: NodePgDatabase,
  mediaType: SearchIndexExport['mediaType'],
  total: number,
) {
  if (!isExportComplete(mediaType, total)) {
    console.error(
      `⚠️ ${mediaType}: only ${total.toLocaleString('en-US')} rows ingested (expected at least ${MIN_EXPORT_ROWS[mediaType].toLocaleString('en-US')}); skipping the stale-row prune for this type`,
    );
    return false;
  }

  const stale = await deleteStaleSearchIndexRows(db, mediaType);
  if (stale > 0) {
    console.log(
      `🧹 ${mediaType}: pruned ${stale.toLocaleString('en-US')} rows gone from the export`,
    );
  }
  return true;
}

async function main() {
  const db = await connectForCron(env.DATABASE_URL, 1);
  const workDir = await mkdtemp(join(tmpdir(), 'search-index-'));

  let incomplete = 0;
  try {
    for (const exportFile of SEARCH_INDEX_EXPORTS) {
      const total = await ingestExport(db, exportFile, workDir);
      if (!(await pruneIfComplete(db, exportFile.mediaType, total))) {
        incomplete++;
      }
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
    await db.$client.end();
  }

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
