function scrollToTarget() {
  const container = document.querySelector('#content-container');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Scrolls the results container (`#content-container`) to the top of the
 * viewport, falling back to the top of the page when no container is present.
 * The container's `scroll-margin` leaves a small gap above the first item.
 *
 * Call this from a user gesture (e.g. a pagination link's `onClick`). WebKit runs
 * its own scroll ~300ms after a soft navigation's `pushState`, landing partway up
 * the page; we re-assert the target once after that settles.
 */
export function scrollToContent() {
  scrollToTarget();
  setTimeout(scrollToTarget, 350);
}
