/**
 * Runs `fn` over every item and keeps the results that resolved, preserving
 * order. Use it where one failed lookup (e.g. a title TMDB no longer has)
 * should drop that item rather than fail the whole page.
 */
export async function fulfilledValues<T, R>(
  items: readonly T[],
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const settled = await Promise.allSettled(items.map(fn));
  const values: R[] = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      values.push(result.value);
    }
  }
  return values;
}
