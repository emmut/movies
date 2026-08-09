import { describe, expect, it } from 'vitest';

import {
  DISCOVER_PAGE_SIZE,
  DISCOVER_SNAPSHOT_PAGES,
  dedupeById,
  sliceSnapshotPage,
  snapshotIndexForPage,
  tmdbPagesForSnapshot,
} from './discover-snapshot';

describe('snapshotIndexForPage', () => {
  it('groups consecutive pages into the same snapshot', () => {
    expect(snapshotIndexForPage(1)).toBe(0);
    expect(snapshotIndexForPage(DISCOVER_SNAPSHOT_PAGES)).toBe(0);
    expect(snapshotIndexForPage(DISCOVER_SNAPSHOT_PAGES + 1)).toBe(1);
    expect(snapshotIndexForPage(42)).toBe(Math.floor(41 / DISCOVER_SNAPSHOT_PAGES));
  });
});

describe('tmdbPagesForSnapshot', () => {
  it('returns the consecutive TMDb pages covered by the snapshot', () => {
    expect(tmdbPagesForSnapshot(0)).toEqual([1, 2, 3, 4, 5]);
    expect(tmdbPagesForSnapshot(1)).toEqual([6, 7, 8, 9, 10]);
  });

  it('round-trips with snapshotIndexForPage', () => {
    for (const snapshotIndex of [0, 1, 7]) {
      for (const page of tmdbPagesForSnapshot(snapshotIndex)) {
        expect(snapshotIndexForPage(page)).toBe(snapshotIndex);
      }
    }
  });
});

describe('sliceSnapshotPage', () => {
  const snapshot = Array.from(
    { length: DISCOVER_SNAPSHOT_PAGES * DISCOVER_PAGE_SIZE },
    (_, index) => index,
  );

  it('slices the page-sized window matching the position within the snapshot', () => {
    expect(sliceSnapshotPage(snapshot, 1)).toEqual(snapshot.slice(0, DISCOVER_PAGE_SIZE));
    expect(sliceSnapshotPage(snapshot, 2)).toEqual(
      snapshot.slice(DISCOVER_PAGE_SIZE, DISCOVER_PAGE_SIZE * 2),
    );
    expect(sliceSnapshotPage(snapshot, DISCOVER_SNAPSHOT_PAGES)).toEqual(
      snapshot.slice(-DISCOVER_PAGE_SIZE),
    );
  });

  it('uses the same window for the matching page of any snapshot', () => {
    expect(sliceSnapshotPage(snapshot, DISCOVER_SNAPSHOT_PAGES + 1)).toEqual(
      sliceSnapshotPage(snapshot, 1),
    );
  });

  it('returns a short final page when deduplication shrank the snapshot', () => {
    const shrunk = snapshot.slice(0, -3);

    expect(sliceSnapshotPage(shrunk, DISCOVER_SNAPSHOT_PAGES)).toHaveLength(DISCOVER_PAGE_SIZE - 3);
  });
});

describe('dedupeById', () => {
  it('keeps the first occurrence of each id', () => {
    const results = [
      { id: 1, page: 1 },
      { id: 2, page: 1 },
      { id: 1, page: 2 },
      { id: 3, page: 2 },
    ];

    expect(dedupeById(results)).toEqual([
      { id: 1, page: 1 },
      { id: 2, page: 1 },
      { id: 3, page: 2 },
    ]);
  });

  it('leaves unique results unchanged', () => {
    const results = [{ id: 1 }, { id: 2 }];

    expect(dedupeById(results)).toEqual(results);
  });
});
