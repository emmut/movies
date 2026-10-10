/** A remembered offset must fit the scroll range, not merely the content height. */
export function canRestoreScroll(offset: number, contentHeight: number, viewportHeight: number) {
  return viewportHeight > 0 && contentHeight - viewportHeight >= offset;
}

export type ScrollTarget =
  | { scrollTo: (options: { y: number; animated: boolean }) => void }
  | { scrollToOffset: (options: { offset: number; animated: boolean }) => void };

export function restoreScrollPosition(target: ScrollTarget, offset: number) {
  if ('scrollTo' in target) {
    target.scrollTo({ y: offset, animated: false });
  } else {
    target.scrollToOffset({ offset, animated: false });
  }
}

/** Browser scroll events can lag behind the click that navigates away. */
export function readScrollOffset(node: unknown, fallback: number) {
  if (!node || typeof node !== 'object') return fallback;
  if (!('scrollTop' in node) || !('clientHeight' in node)) return fallback;
  if (typeof node.scrollTop !== 'number' || node.clientHeight === 0) return fallback;
  return Math.max(0, node.scrollTop);
}
