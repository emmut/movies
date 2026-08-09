/**
 * Helpers for serving TMDb `/discover` pages out of cached multi-page
 * snapshots.
 *
 * TMDb re-sorts `/discover` on every request and the default
 * `popularity.desc` ordering drifts continuously, so two pages requested at
 * different moments can overlap (or skip titles) at their boundary. Instead
 * of fetching one TMDb page per app page, the discover fetchers grab
 * `DISCOVER_SNAPSHOT_PAGES` consecutive TMDb pages in a single cached call
 * and slice app pages out of that snapshot. Every page inside a snapshot then
 * comes from the same ordering, and all users share the slicing until the
 * cache entry revalidates.
 */

/** TMDb's fixed `/discover` page size — the API offers no page-size param. */
export const DISCOVER_PAGE_SIZE = 20;

/** Consecutive TMDb pages fetched together into one cached snapshot. */
export const DISCOVER_SNAPSHOT_PAGES = 5;

/**
 * Zero-based index of the snapshot containing the given one-based app page.
 */
export function snapshotIndexForPage(page: number): number {
  return Math.floor((page - 1) / DISCOVER_SNAPSHOT_PAGES);
}

/**
 * One-based TMDb page numbers that make up the given snapshot.
 */
export function tmdbPagesForSnapshot(snapshotIndex: number): number[] {
  const firstPage = snapshotIndex * DISCOVER_SNAPSHOT_PAGES + 1;
  return Array.from({ length: DISCOVER_SNAPSHOT_PAGES }, (_, offset) => firstPage + offset);
}

/**
 * Slice of a snapshot's results belonging to the given one-based app page.
 */
export function sliceSnapshotPage<T>(results: T[], page: number): T[] {
  const offset = ((page - 1) % DISCOVER_SNAPSHOT_PAGES) * DISCOVER_PAGE_SIZE;
  return results.slice(offset, offset + DISCOVER_PAGE_SIZE);
}

/**
 * Drops repeated ids, keeping the first occurrence. The TMDb pages inside a
 * snapshot are fetched near-simultaneously, but the ordering can still shift
 * mid-flight, so the merged snapshot is deduplicated once before slicing.
 */
export function dedupeById<T extends { id: number }>(results: T[]): T[] {
  const seen = new Set<number>();
  return results.filter((result) => {
    if (seen.has(result.id)) {
      return false;
    }
    seen.add(result.id);
    return true;
  });
}
