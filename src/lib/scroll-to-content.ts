// Coordinates "paginate, then scroll to the top of the results".
//
// The scroll can't happen at click time: the new page renders later (often
// behind a `<Suspense key={page}>` fallback) and the document height changes
// under an early scroll. Instead the click schedules the scroll here and
// PaginationControls performs it in an effect once the new page is on screen.
// Module state rather than React state: the Suspense swap remounts the
// controls, which would lose anything stored in the component.
//
// The schedule is scoped to the navigation's destination so it can't leak: a
// later render anywhere else (the navigation was abandoned or superseded)
// clears it instead of scrolling.

type ScheduledScroll = {
  pathname: string;
  search: string;
};

function normalizedSearch(url: URL) {
  const params = new URLSearchParams(url.search);
  params.sort();
  return params.toString();
}

let scheduled: ScheduledScroll | null = null;

/**
 * Called at click time, before the pagination navigation starts.
 *
 * @param href - The pagination link's destination (`?page=N` or a full path).
 */
export function scheduleScrollToContent(href: string) {
  const destination = new URL(href, window.location.href);
  scheduled = {
    pathname: destination.pathname,
    search: normalizedSearch(destination),
  };
}

/**
 * Scrolls the paginated results (`#content`) into view if a pagination click
 * scheduled it for the current location; no-op otherwise. The target's
 * `scroll-m-*` class provides the small gap above the first item.
 */
export function scrollToContentIfScheduled() {
  if (!scheduled) {
    return;
  }

  const location = new URL(window.location.href);
  const atDestination =
    location.pathname === scheduled.pathname && normalizedSearch(location) === scheduled.search;
  if (!atDestination) {
    // The scheduled navigation never landed — drop it so it can't scroll an
    // unrelated page later.
    scheduled = null;
    return;
  }

  const results = document.getElementById('content');
  if (!results) {
    // At the destination but the results anchor isn't on screen yet (it can
    // mount in a later commit than the pagination controls) — keep the
    // schedule so that render can still trigger the scroll.
    return;
  }

  scheduled = null;
  // Smooth is safe here: the scroll runs after the new page has rendered, so
  // no skeleton swap can move the target mid-animation (which is what forced
  // the old click-time implementation to scroll instantly).
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
