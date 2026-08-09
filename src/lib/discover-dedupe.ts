import type { DiscoverResult } from '@/lib/discover-client';

/**
 * Removes from `current` any result whose id also appears on the previous
 * discover page.
 *
 * TMDb's `/discover` endpoints re-sort the full result set on every request
 * and the default `popularity.desc` ordering drifts continuously, so a title
 * sitting near a page boundary can legitimately be returned on both page N
 * and page N + 1. The API has no snapshot/cursor mechanism, so the overlap is
 * trimmed client-side against the cached previous page instead.
 *
 * Returns `current` untouched when there is nothing to remove, so React Query
 * consumers keep a referentially stable result.
 */
export function dedupeDiscoverResults(
  current: DiscoverResult,
  previousResults: ReadonlyArray<{ id: number }> | undefined,
): DiscoverResult {
  if (!previousResults || previousResults.length === 0) {
    return current;
  }

  const previousIds = new Set(previousResults.map((result) => result.id));
  if (!current.results.some((result) => previousIds.has(result.id))) {
    return current;
  }

  // Filtering only removes elements, so narrowing the union back is safe.
  const results = current.results.filter(
    (result) => !previousIds.has(result.id),
  ) as typeof current.results;

  return { ...current, results };
}
