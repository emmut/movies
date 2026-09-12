import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { describe, expect, it, vi } from 'vitest';

import {
  deleteStaleSearchIndexRows,
  exportDates,
  exportFileUrl,
  ingestExportLines,
  isExportComplete,
  MIN_EXPORT_ROWS,
  normalizeSearchTitle,
  parseExportLine,
  SEARCH_INDEX_EXPORTS,
  upsertSearchIndexBatch,
} from './search-index-ingest';

describe('normalizeSearchTitle', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeSearchTitle('Amélie')).toBe('amelie');
    expect(normalizeSearchTitle('Léon: The Professional')).toBe('leon the professional');
  });

  it('collapses punctuation and whitespace runs to single spaces', () => {
    expect(normalizeSearchTitle('Spider-Man: No Way Home')).toBe('spider man no way home');
    expect(normalizeSearchTitle('WALL·E')).toBe('wall e');
    expect(normalizeSearchTitle('  The   Matrix  ')).toBe('the matrix');
  });

  it('keeps letters and digits of every script', () => {
    expect(normalizeSearchTitle('千と千尋の神隠し')).toBe('千と千尋の神隠し');
    expect(normalizeSearchTitle('Blade Runner 2049')).toBe('blade runner 2049');
  });

  it('returns an empty string for punctuation-only titles', () => {
    expect(normalizeSearchTitle('???')).toBe('');
  });
});

describe('exportFileUrl', () => {
  it('formats the date as MM_DD_YYYY in UTC', () => {
    expect(exportFileUrl('movie_ids', new Date('2026-09-04T01:00:00Z'))).toBe(
      'https://files.tmdb.org/p/exports/movie_ids_09_04_2026.json.gz',
    );
    expect(exportFileUrl('person_ids', new Date('2026-12-25T23:59:00Z'))).toBe(
      'https://files.tmdb.org/p/exports/person_ids_12_25_2026.json.gz',
    );
  });
});

describe('exportDates', () => {
  it('yields today then yesterday, crossing month boundaries in UTC', () => {
    const dates = exportDates(new Date('2026-10-01T09:00:00Z'));

    expect(dates.map((date) => date.toISOString().slice(0, 10))).toEqual([
      '2026-10-01',
      '2026-09-30',
    ]);
  });
});

describe('SEARCH_INDEX_EXPORTS', () => {
  it('covers movies, TV series, and people', () => {
    expect(SEARCH_INDEX_EXPORTS.map((entry) => entry.mediaType)).toEqual(['movie', 'tv', 'person']);
  });
});

describe('parseExportLine', () => {
  it('parses a movie line', () => {
    expect(
      parseExportLine(
        'movie',
        '{"adult":false,"id":550,"original_title":"Fight Club","popularity":61.4,"video":false}',
      ),
    ).toEqual({
      mediaType: 'movie',
      tmdbId: 550,
      title: 'Fight Club',
      searchTitle: 'fight club',
      popularity: 61.4,
    });
  });

  it('parses a TV line, which names the title original_name', () => {
    expect(
      parseExportLine('tv', '{"id":1396,"original_name":"Breaking Bad","popularity":300.1}'),
    ).toMatchObject({ mediaType: 'tv', tmdbId: 1396, title: 'Breaking Bad' });
  });

  it('parses a person line, which uses name', () => {
    expect(
      parseExportLine('person', '{"adult":false,"id":287,"name":"Brad Pitt","popularity":40}'),
    ).toMatchObject({ mediaType: 'person', tmdbId: 287, searchTitle: 'brad pitt' });
  });

  it('skips adult entries', () => {
    expect(
      parseExportLine('movie', '{"adult":true,"id":1,"original_title":"x","popularity":1}'),
    ).toBeNull();
  });

  it('defaults a missing or non-finite popularity to 0', () => {
    expect(parseExportLine('movie', '{"id":1,"original_title":"x"}')?.popularity).toBe(0);
    expect(
      parseExportLine('movie', '{"id":1,"original_title":"x","popularity":"high"}')?.popularity,
    ).toBe(0);
  });

  it('rejects malformed JSON and non-object lines', () => {
    expect(parseExportLine('movie', '{not json')).toBeNull();
    expect(parseExportLine('movie', 'null')).toBeNull();
    expect(parseExportLine('movie', '42')).toBeNull();
  });

  it('rejects a missing, non-integer, or non-positive id', () => {
    expect(parseExportLine('movie', '{"original_title":"x"}')).toBeNull();
    expect(parseExportLine('movie', '{"id":"550","original_title":"x"}')).toBeNull();
    expect(parseExportLine('movie', '{"id":1.5,"original_title":"x"}')).toBeNull();
    expect(parseExportLine('movie', '{"id":0,"original_title":"x"}')).toBeNull();
  });

  it('rejects a missing, blank, or punctuation-only title', () => {
    expect(parseExportLine('movie', '{"id":1}')).toBeNull();
    expect(parseExportLine('movie', '{"id":1,"original_title":"   "}')).toBeNull();
    expect(parseExportLine('movie', '{"id":1,"original_title":"..."}')).toBeNull();
  });
});

describe('upsertSearchIndexBatch', () => {
  function mockDatabase() {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    const insert = vi.fn().mockReturnValue({ values });
    return {
      database: { insert } as unknown as NodePgDatabase,
      insert,
      values,
      onConflictDoUpdate,
    };
  }

  it('does nothing for an empty batch', async () => {
    const { database, insert } = mockDatabase();
    await upsertSearchIndexBatch(database, []);
    expect(insert).not.toHaveBeenCalled();
  });

  it('upserts on the (media_type, tmdb_id) key, refreshing every field', async () => {
    const { database, values, onConflictDoUpdate } = mockDatabase();
    const rows = [
      {
        mediaType: 'movie' as const,
        tmdbId: 550,
        title: 'Fight Club',
        searchTitle: 'fight club',
        popularity: 1,
      },
    ];

    await upsertSearchIndexBatch(database, rows);

    expect(values).toHaveBeenCalledWith(rows);
    expect(onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({
          title: expect.anything(),
          searchTitle: expect.anything(),
          popularity: expect.anything(),
          updatedAt: expect.anything(),
        }),
      }),
    );
  });
});

describe('isExportComplete', () => {
  it('accepts a total at or above the media type’s floor', () => {
    expect(isExportComplete('movie', MIN_EXPORT_ROWS.movie)).toBe(true);
    expect(isExportComplete('person', MIN_EXPORT_ROWS.person + 1)).toBe(true);
  });

  it('rejects an empty or truncated export', () => {
    expect(isExportComplete('movie', 0)).toBe(false);
    expect(isExportComplete('tv', MIN_EXPORT_ROWS.tv - 1)).toBe(false);
  });

  it('keeps the floors well under the real export sizes', () => {
    // Roughly 1M movies, 200k TV series, 3M+ people; a floor near the real
    // size would fail healthy runs, a floor near zero would not catch a
    // broken parser.
    expect(MIN_EXPORT_ROWS.movie).toBeLessThan(900_000);
    expect(MIN_EXPORT_ROWS.tv).toBeLessThan(180_000);
    expect(MIN_EXPORT_ROWS.person).toBeLessThan(2_500_000);
    expect(MIN_EXPORT_ROWS.tv).toBeGreaterThan(10_000);
  });
});

describe('deleteStaleSearchIndexRows', () => {
  it('returns the number of pruned rows for the given media type', async () => {
    const returning = vi.fn().mockResolvedValue([{ tmdbId: 1 }, { tmdbId: 2 }]);
    const where = vi.fn().mockReturnValue({ returning });
    const database = { delete: vi.fn().mockReturnValue({ where }) } as unknown as NodePgDatabase;

    await expect(deleteStaleSearchIndexRows(database, 'movie')).resolves.toBe(2);
    expect(where).toHaveBeenCalledTimes(1);
  });

  it('scopes the delete to one media type', async () => {
    const { PgDialect } = await import('drizzle-orm/pg-core');
    const where = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) });
    const database = { delete: vi.fn().mockReturnValue({ where }) } as unknown as NodePgDatabase;

    await deleteStaleSearchIndexRows(database, 'tv');

    const rendered = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(rendered.sql).toContain('"search_index"."media_type" = $1');
    expect(rendered.sql).toContain('"search_index"."updated_at" <');
    expect(rendered.params).toEqual(['tv']);
  });
});

describe('ingestExportLines', () => {
  async function* lines(...values: string[]) {
    for (const value of values) {
      yield value;
    }
  }

  function mockDatabase() {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    const insert = vi.fn().mockReturnValue({ values });
    return { database: { insert } as unknown as NodePgDatabase, values };
  }

  it('parses, batches, and reports totals, skipping blank and bad lines', async () => {
    const { database, values } = mockDatabase();
    const onProgress = vi.fn();

    const result = await ingestExportLines(
      database,
      'movie',
      lines(
        '{"id":1,"original_title":"A","popularity":1}',
        '',
        'not json',
        '{"adult":true,"id":2,"original_title":"B"}',
        '{"id":3,"original_title":"C"}',
        '{"id":4,"original_title":"D"}',
      ),
      { batchSize: 2, onProgress },
    );

    expect(result).toEqual({ total: 3, skipped: 2 });
    // Two full batches would be [1,3] then [4]; the trailing flush writes the remainder.
    expect(values).toHaveBeenCalledTimes(2);
    expect(values.mock.calls[0][0].map((row: { tmdbId: number }) => row.tmdbId)).toEqual([1, 3]);
    expect(values.mock.calls[1][0].map((row: { tmdbId: number }) => row.tmdbId)).toEqual([4]);
    expect(onProgress.mock.calls.map(([total]) => total)).toEqual([2, 3]);
  });

  it('writes nothing for an empty stream', async () => {
    const { database, values } = mockDatabase();

    await expect(ingestExportLines(database, 'tv', lines(), { batchSize: 10 })).resolves.toEqual({
      total: 0,
      skipped: 0,
    });
    expect(values).not.toHaveBeenCalled();
  });
});
