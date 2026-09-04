import { lt, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { searchIndex } from '@/db/schema/search-index';

// No 'server-only' here: the nightly ingest (scripts/ingest-search-index.ts)
// runs under tsx outside the Next.js server runtime.

export type SearchIndexMediaType = 'movie' | 'tv' | 'person';

export type SearchIndexRow = typeof searchIndex.$inferInsert;

/** One of TMDB's daily export files and the media type its lines describe. */
export type SearchIndexExport = {
  mediaType: SearchIndexMediaType;
  /** File name prefix as published, e.g. `movie_ids_09_04_2026.json.gz`. */
  file: 'movie_ids' | 'tv_series_ids' | 'person_ids';
};

export const SEARCH_INDEX_EXPORTS: readonly SearchIndexExport[] = [
  { mediaType: 'movie', file: 'movie_ids' },
  { mediaType: 'tv', file: 'tv_series_ids' },
  { mediaType: 'person', file: 'person_ids' },
];

const EXPORTS_BASE_URL = 'https://files.tmdb.org/p/exports';

/**
 * Folds a title for trigram matching: Unicode-decomposed with combining
 * marks stripped (so "Amélie" and "Amelie" agree), lowercased, and every
 * run of punctuation or whitespace collapsed to one space ("Spider-Man" →
 * "spider man"). Letters and digits of every script survive. Apply the same
 * fold to queries.
 */
export function normalizeSearchTitle(title: string) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

/** The published URL of an export for a given UTC date (TMDB names files MM_DD_YYYY). */
export function exportFileUrl(file: SearchIndexExport['file'], date: Date) {
  const stamp = `${pad(date.getUTCMonth() + 1)}_${pad(date.getUTCDate())}_${date.getUTCFullYear()}`;
  return `${EXPORTS_BASE_URL}/${file}_${stamp}.json.gz`;
}

/**
 * The dates to try for today's export, newest first. TMDB publishes by
 * 08:00 UTC; if today's file is not up yet, yesterday's is the freshest.
 */
export function exportDates(now = new Date()) {
  const today = new Date(now);
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return [today, yesterday];
}

type ExportLine = {
  id?: unknown;
  adult?: unknown;
  popularity?: unknown;
  original_title?: unknown;
  original_name?: unknown;
  name?: unknown;
};

function exportTitle(line: ExportLine) {
  const title = line.original_title ?? line.original_name ?? line.name;
  return typeof title === 'string' && title.trim() ? title.trim() : null;
}

/**
 * Parses one JSON line of a TMDB export into an index row. Adult entries and
 * lines without a usable id or title are skipped (null); the app never shows
 * adult content, so it never needs to find it.
 */
export function parseExportLine(
  mediaType: SearchIndexMediaType,
  line: string,
): SearchIndexRow | null {
  let parsed: ExportLine;
  try {
    parsed = JSON.parse(line) as ExportLine;
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || parsed.adult === true) {
    return null;
  }

  const id = parsed.id;
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    return null;
  }

  const title = exportTitle(parsed);
  if (!title) {
    return null;
  }

  const searchTitle = normalizeSearchTitle(title);
  if (!searchTitle) {
    return null;
  }

  const popularity =
    typeof parsed.popularity === 'number' && Number.isFinite(parsed.popularity)
      ? parsed.popularity
      : 0;

  return { mediaType, tmdbId: id, title, searchTitle, popularity };
}

/**
 * Upserts a batch of index rows, refreshing title, folded title, popularity,
 * and updated_at for rows that already exist.
 *
 * @param database - The drizzle database handle to write through.
 * @param rows - Parsed rows; a no-op when empty.
 */
export async function upsertSearchIndexBatch(database: NodePgDatabase, rows: SearchIndexRow[]) {
  if (rows.length === 0) {
    return;
  }

  await database
    .insert(searchIndex)
    .values(rows)
    .onConflictDoUpdate({
      target: [searchIndex.mediaType, searchIndex.tmdbId],
      set: {
        title: sql`excluded.title`,
        searchTitle: sql`excluded.search_title`,
        popularity: sql`excluded.popularity`,
        updatedAt: sql`now()`,
      },
    });
}

export type IngestExportOptions = {
  /** Rows per upsert statement. */
  batchSize: number;
  /** Called after each flushed batch with the running total. */
  onProgress?: (total: number) => void;
};

/**
 * Streams one export's lines into the index: parses each, upserts in
 * batches, and reports how many rows were written and how many lines were
 * skipped (adult or malformed). Blank lines are ignored.
 */
export async function ingestExportLines(
  database: NodePgDatabase,
  mediaType: SearchIndexMediaType,
  lines: AsyncIterable<string>,
  { batchSize, onProgress }: IngestExportOptions,
) {
  let total = 0;
  let skipped = 0;
  let batch: SearchIndexRow[] = [];

  async function flush() {
    await upsertSearchIndexBatch(database, batch);
    total += batch.length;
    batch = [];
    onProgress?.(total);
  }

  for await (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    const row = parseExportLine(mediaType, line);
    if (!row) {
      skipped++;
      continue;
    }
    batch.push(row);
    if (batch.length >= batchSize) {
      await flush();
    }
  }
  await flush();

  return { total, skipped };
}

/**
 * Deletes rows that stopped appearing in the daily exports — ids TMDB has
 * removed would otherwise keep matching forever and 404 on click. The grace
 * period is generous next to the daily cadence, so a few failed runs never
 * purge live data.
 *
 * @returns The number of deleted rows.
 */
export async function deleteStaleSearchIndexRows(database: NodePgDatabase) {
  const deleted = await database
    .delete(searchIndex)
    .where(lt(searchIndex.updatedAt, sql`now() - interval '7 days'`))
    .returning({ tmdbId: searchIndex.tmdbId });
  return deleted.length;
}
