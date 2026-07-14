'use client';

import { useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';

import { sameIdOrder } from '@/lib/list-order';

type ReorderableItem = { listItemId: string };

/**
 * Manual list-item reordering with optimistic local state.
 *
 * Keeps a local copy of `items` that is swapped immediately on a move, then
 * persisted through `commit`. If `commit` rejects, the local copy is rolled
 * back. The server-rendered `items` prop resets the local copy whenever it
 * changes identity (i.e. after a refetch), replacing effect-based sync —
 * except while a move is pending, when a stale refresh is ignored rather
 * than allowed to undo the optimistic order.
 *
 * @param items - The current page's items, each carrying a `listItemId`.
 * @param offset - 0-based index of the first item in `items` within the full
 *   list, so `toLocalIndex` can be translated to a global index for `commit`.
 * @param commit - Persists a move of `itemId` to `toGlobalIndex`.
 */
export function useReorderableItems<T extends ReorderableItem>(
  items: T[],
  offset: number,
  commit: (itemId: string, toGlobalIndex: number, previous: T[]) => Promise<void>,
) {
  const [isPending, setIsPending] = useState(false);
  const [localItems, setLocalItems] = useState(items);
  const [prevItems, setPrevItems] = useState(items);

  // Render-time reset when the server-rendered prop changes — the React-docs
  // replacement for syncing props into state with an effect. While a move is
  // in flight, a refresh carrying the pre-move order must not clobber the
  // optimistic order (it would snap back until the next refresh); adopt it
  // only once idle, or immediately when it already agrees with the local
  // order (fresh data, nothing moves).
  if (prevItems !== items) {
    setPrevItems(items);
    if (
      !isPending ||
      sameIdOrder(
        items.map((item) => item.listItemId),
        localItems.map((item) => item.listItemId),
      )
    ) {
      setLocalItems(items);
    }
  }

  async function commitMove(itemId: string, toLocalIndex: number, previous: T[]) {
    setIsPending(true);
    try {
      await commit(itemId, Math.max(0, offset + toLocalIndex), previous);
    } catch (error) {
      setLocalItems(previous);
      toast.error(error instanceof Error ? error.message : 'Failed to reorder items');
    } finally {
      setIsPending(false);
    }
  }

  function move(itemId: string, toLocalIndex: number) {
    const fromLocalIndex = localItems.findIndex((item) => item.listItemId === itemId);
    if (isPending || fromLocalIndex === -1 || toLocalIndex === fromLocalIndex) {
      return;
    }
    const clampedIndex = Math.max(0, Math.min(toLocalIndex, localItems.length - 1));
    setLocalItems(arrayMove(localItems, fromLocalIndex, clampedIndex));
    void commitMove(itemId, clampedIndex, localItems);
  }

  return { localItems, isPending, move };
}
