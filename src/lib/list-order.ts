/**
 * Returns a copy of `orderedIds` with `id` moved to `toIndex`, clamping the
 * index to the array bounds. Returns `null` when `id` is not present.
 */
export function moveIdToIndex(orderedIds: string[], id: string, toIndex: number) {
  const fromIndex = orderedIds.indexOf(id);

  if (fromIndex === -1) {
    return null;
  }

  const next = [...orderedIds];
  next.splice(fromIndex, 1);
  next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, id);
  return next;
}
