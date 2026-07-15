/**
 * Scrolls the results container (`#content-container`) to the top of the
 * viewport, falling back to the top of the page when no container is present.
 *
 * Call this from a user gesture (e.g. a pagination link's `onClick`) rather than
 * an effect: the container's position is stable across page changes, so scrolling
 * on click is reliable on mobile and never fires on unrelated navigation (back /
 * forward, deep links) the way a `page`-watching effect does.
 */
export function scrollToContent() {
  const container = document.querySelector('#content-container');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
