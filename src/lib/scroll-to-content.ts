/**
 * Scrolls the results container (`#content-container`) to the top of the
 * viewport, falling back to the top of the page when it's absent. The
 * container's `scroll-margin` leaves a small gap above the first item.
 *
 * Instant, and called from the click handler before navigation: the scroll
 * lands in the same tick, so there's no animation or soft-nav scroll restore
 * left running to fight or clobber it.
 */
export function scrollToContent() {
  const container = document.querySelector('#content-container');
  if (container) {
    container.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
  }
}
