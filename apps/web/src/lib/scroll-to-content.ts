// Coordinates "paginate, then scroll to the top of the results".
//
// The click schedules a scroll; PaginationControls performs it when the
// destination is on screen. Server navigations wait for the new page, while
// shallow client-query updates scroll once skeletons mount and the URL
// flushes, without waiting for the request. Module state rather than React
// state: a loading state can swap the controls out (e.g. discover's
// spinner), and a remount would lose anything stored in the component.
// The body keeps its current height in the meantime: at narrow WebKit
// viewports, the brief route handoff can otherwise clamp the scroll position
// above the results before or during the smooth scroll.
//
// The schedule is scoped to the navigation's destination so it can't leak: a
// later render anywhere else (the navigation was abandoned or superseded)
// clears it instead of scrolling.

type ScheduledScroll = {
  pathname: string;
  search: string;
  restoreLayout: () => void;
};

function normalizedSearch(url: URL) {
  const params = new URLSearchParams(url.search);
  params.sort();
  return params.toString();
}

let scheduled: ScheduledScroll | null = null;
let finishScroll: (() => void) | null = null;

function holdPageLayout() {
  const { style } = document.body;
  const { minHeight, overflowAnchor } = style;
  style.minHeight = `${document.documentElement.scrollHeight}px`;
  style.overflowAnchor = 'none';

  return function restoreLayout() {
    style.minHeight = minHeight;
    style.overflowAnchor = overflowAnchor;
  };
}

function restoreAfterScroll(restoreLayout: () => void) {
  let finished = false;
  let timer: ReturnType<typeof setTimeout>;

  function finish() {
    if (finished) {
      return;
    }
    finished = true;
    clearTimeout(timer);
    document.removeEventListener('scroll', onScroll);
    document.removeEventListener('scrollend', finish);
    window.removeEventListener('popstate', finish);
    restoreLayout();
    finishScroll = null;
  }

  function onScroll() {
    clearTimeout(timer);
    timer = setTimeout(finish, 200);
  }

  finishScroll = finish;
  document.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('scrollend', finish);
  window.addEventListener('popstate', finish);
  // Also covers browsers without scrollend and calls that do not move the
  // viewport. This observes scroll completion; the browser owns the animation.
  onScroll();
}

/**
 * Called at click time, before the pagination navigation starts.
 *
 * @param href - The pagination link's destination (`?page=N` or a full path).
 */
export function scheduleScrollToContent(href: string) {
  finishScroll?.();
  scheduled?.restoreLayout();

  const destination = new URL(href, window.location.href);
  scheduled = {
    pathname: destination.pathname,
    search: normalizedSearch(destination),
    restoreLayout: holdPageLayout(),
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
    scheduled.restoreLayout();
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

  const { restoreLayout } = scheduled;
  scheduled = null;
  // Keep the old height and suppress scroll anchoring until scrolling ends.
  // A shorter cached page, or a response arriving mid-scroll, would otherwise
  // clamp the viewport partway up before the native animation can reach it.
  results.getBoundingClientRect();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) {
    restoreAfterScroll(restoreLayout);
  }
  results.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
  if (reducedMotion) {
    restoreLayout();
  }
}
