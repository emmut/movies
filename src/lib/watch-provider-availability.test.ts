import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { select: vi.fn() } }));
vi.mock('@/lib/title-sync-server', () => ({ appTitleSource: { source: 'app' } }));
vi.mock('@/lib/title-sync', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/title-sync')>();
  return {
    ...actual,
    selectTitlesNeedingAvailability: vi.fn(),
    syncTitleAvailability: vi.fn(),
  };
});

import { sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { selectTitlesNeedingAvailability, syncTitleAvailability } from '@/lib/title-sync';

import {
  ensureAvailabilityKnown,
  parseWatchProviderFilter,
  streamableOnProviders,
} from './watch-provider-availability';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('parseWatchProviderFilter', () => {
  it('returns null when no providers are requested', () => {
    expect(parseWatchProviderFilter(undefined, 'SE')).toBeNull();
    expect(parseWatchProviderFilter([], 'SE')).toBeNull();
  });

  it('validates providers and keeps the given region', () => {
    expect(parseWatchProviderFilter([8, 337], 'US')).toEqual({
      providerIds: [8, 337],
      region: 'US',
    });
  });

  it('falls back to the default region when none is given', () => {
    expect(parseWatchProviderFilter([8])).toEqual({ providerIds: [8], region: 'SE' });
  });

  it('rejects unknown regions', () => {
    expect(() => parseWatchProviderFilter([8], 'XX')).toThrow();
  });

  it('rejects malformed provider ids', () => {
    expect(() => parseWatchProviderFilter([0], 'SE')).toThrow();
    expect(() => parseWatchProviderFilter([1.5], 'SE')).toThrow();
  });
});

describe('streamableOnProviders', () => {
  function render(filter: { providerIds: number[]; region: string }) {
    const query = new PgDialect().sqlToQuery(streamableOnProviders(filter));
    return { sql: query.sql.replace(/\s+/g, ' '), params: query.params };
  }

  it('correlates the availability rows with the outer list_items row', () => {
    const { sql } = render({ providerIds: [8], region: 'SE' });

    expect(sql).toContain('exists ( select 1 from "title_availability"');
    expect(sql).toContain('"title_availability"."media_type" = "list_items"."resource_type"');
    expect(sql).toContain('"title_availability"."tmdb_id" = "list_items"."resource_id"');
  });

  it('binds the region and provider ids as parameters', () => {
    const { sql, params } = render({ providerIds: [8, 337], region: 'US' });

    expect(sql).toContain('"title_availability"."region" = $1');
    expect(sql).toContain('"title_availability"."provider_id" = any($2::integer[])');
    expect(params).toEqual(['US', [8, 337]]);
  });

  it('only counts streaming offers, never rent or buy', () => {
    const { sql } = render({ providerIds: [8], region: 'SE' });

    expect(sql).toContain(`"title_availability"."offer_type" in ('flatrate', 'free')`);
    expect(sql).not.toContain('rent');
  });
});

describe('ensureAvailabilityKnown', () => {
  const scope = sql`list_id = 'list-1'`;

  it('does nothing when every title in scope is already known', async () => {
    vi.mocked(selectTitlesNeedingAvailability).mockResolvedValue([]);

    await expect(ensureAvailabilityKnown(scope)).resolves.toBe(0);
    expect(selectTitlesNeedingAvailability).toHaveBeenCalledWith(db, { scope });
    expect(syncTitleAvailability).not.toHaveBeenCalled();
  });

  it('syncs each unknown title through the app source', async () => {
    const missing = [
      { mediaType: 'movie' as const, tmdbId: 1 },
      { mediaType: 'tv' as const, tmdbId: 2 },
    ];
    vi.mocked(selectTitlesNeedingAvailability).mockResolvedValue(missing);
    vi.mocked(syncTitleAvailability).mockResolvedValue('synced');

    await expect(ensureAvailabilityKnown(scope)).resolves.toBe(2);
    expect(syncTitleAvailability).toHaveBeenCalledTimes(2);
    expect(syncTitleAvailability).toHaveBeenCalledWith(db, { source: 'app' }, missing[0]);
    expect(syncTitleAvailability).toHaveBeenCalledWith(db, { source: 'app' }, missing[1]);
  });

  it('bounds concurrent syncs while still covering every title', async () => {
    const missing = Array.from({ length: 25 }, (_, i) => ({
      mediaType: 'movie' as const,
      tmdbId: i + 1,
    }));
    vi.mocked(selectTitlesNeedingAvailability).mockResolvedValue(missing);

    let inFlight = 0;
    let maxInFlight = 0;
    vi.mocked(syncTitleAvailability).mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight--;
      return 'synced';
    });

    await expect(ensureAvailabilityKnown(scope)).resolves.toBe(25);
    expect(syncTitleAvailability).toHaveBeenCalledTimes(25);
    expect(maxInFlight).toBeLessThanOrEqual(10);
  });

  it('propagates a failed sync instead of treating the title as unavailable', async () => {
    vi.mocked(selectTitlesNeedingAvailability).mockResolvedValue([
      { mediaType: 'movie', tmdbId: 1 },
    ]);
    vi.mocked(syncTitleAvailability).mockRejectedValue(new Error('TMDB down'));

    await expect(ensureAvailabilityKnown(scope)).rejects.toThrow('TMDB down');
  });
});
