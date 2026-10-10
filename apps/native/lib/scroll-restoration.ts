/** A remembered offset must fit the scroll range, not merely the content height. */
export function canRestoreScroll(offset: number, contentHeight: number, viewportHeight: number) {
  return viewportHeight > 0 && contentHeight - viewportHeight >= offset;
}
