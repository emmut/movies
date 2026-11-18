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
// above the results before or during the smooth scroll, or when delayed
// results replace the skeletons after scrolling has finished.
//
// The schedule is scoped to the navigation's destination so it can't leak: a
// later render anywhere else (the navigation was abandoned or superseded)
// clears it instead of scrolling.

type ScheduledScroll = {
  pathname: string;
  search: string;
  page: number;
  contentReady: boolean;
  scrollFinished: boolean;
  restoreLayout: () => void;
};

function normalizedSearch(url: URL) {
  const params = new URLSearchParams(url.search);
  params.sort();
  return params.toString();
}

let scheduled: ScheduledScroll | null = null;
let active: ScheduledScroll | null = null;
let finishScroll: (() => void) | null = null;

function holdPageLayout() {
  const { style } = document.body;
  const { minHeight, overflowAnchor } = style;
  let restored = false;
  style.minHeight = `${document.documentElement.scrollHeight}px`;
  style.overflowAnchor = 'none';

  function restoreLayout() {
    if (restored) {
      return;
    }
    restored = true;
    window.removeEventListener('popstate', restoreLayout);
    style.minHeight = minHeight;
    style.overflowAnchor = overflowAnchor;
  }
  window.addEventListener('popstate', restoreLayout);
  return restoreLayout;
}

function restoreIfComplete(scroll: ScheduledScroll) {
  if (!scroll.contentReady || !scroll.scrollFinished) {
    return;
  }
  // WebKit can lay out an empty grid while React replaces the skeletons.
  // Flush the completed results layout before releasing the height hold.
  document.getElementById('content')?.getBoundingClientRect();
  scroll.restoreLayout();
  if (active === scroll) {
    active = null;
  }
}

/** The results have committed, including cached, empty and error states. */
export function markPaginationContentReady(page: number) {
  const scroll = scheduled ?? active;
  if (!scroll) {
    return;
  }
  if (scroll.page !== page) {
    if (active) {
      cancelScrollToContent();
    }
    return;
  }
  scroll.contentReady = true;
  restoreIfComplete(scroll);
}

/** Release pending layout protection when the results unmount or navigation changes. */
export function cancelScrollToContent() {
  finishScroll?.();
  active?.restoreLayout();
  active = null;
  scheduled?.restoreLayout();
  scheduled = null;
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
export function scheduleScrollToContent(href: string, { waitForContent = false } = {}) {
  cancelScrollToContent();

  const destination = new URL(href, window.location.href);
  scheduled = {
    pathname: destination.pathname,
    search: normalizedSearch(destination),
    page: Number(destination.searchParams.get('page') ?? '1'),
    contentReady: !waitForContent,
    scrollFinished: false,
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

  const scroll = scheduled;
  active = scroll;
  scheduled = null;
  // Protect both the animation and the results commit: a delayed response
  // can replace skeletons after scrolling has already finished.
  results.getBoundingClientRect();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) {
    restoreAfterScroll(() => {
      scroll.scrollFinished = true;
      restoreIfComplete(scroll);
    });
  }
  results.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
  if (reducedMotion) {
    scroll.scrollFinished = true;
    restoreIfComplete(scroll);
  }
}
