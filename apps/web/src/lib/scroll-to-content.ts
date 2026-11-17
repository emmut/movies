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
// above the results before the smooth scroll begins.
//
// The schedule is scoped to the navigation's destination so it can't leak: a
// later render anywhere else (the navigation was abandoned or superseded)
// clears it instead of scrolling.

type ScheduledScroll = {
  pathname: string;
  search: string;
  bodyMinHeight: string;
};

function normalizedSearch(url: URL) {
  const params = new URLSearchParams(url.search);
  params.sort();
  return params.toString();
}

let scheduled: ScheduledScroll | null = null;
let cancelScroll: (() => void) | null = null;
const SCROLL_DURATION_MS = 1000;

function scrollToResults(results: HTMLElement) {
  const root = document.documentElement;
  const padding = Number.parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
  const margin = Number.parseFloat(getComputedStyle(results).scrollMarginTop) || 0;
  const startY = window.scrollY;
  const top = results.getBoundingClientRect().top + startY - padding - margin;
  const targetY = Math.max(0, Math.min(top, root.scrollHeight - window.innerHeight));

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top: targetY, behavior: 'instant' });
    return;
  }

  const startedAt = performance.now();
  const url = window.location.href;
  let frame = 0;

  function cancel() {
    cancelAnimationFrame(frame);
    window.removeEventListener('wheel', cancel);
    window.removeEventListener('touchstart', cancel);
    window.removeEventListener('keydown', cancel);
    cancelScroll = null;
  }

  function step(now: number) {
    if (window.location.href !== url) {
      cancel();
      return;
    }

    const progress = Math.min(1, (now - startedAt) / SCROLL_DURATION_MS);
    const eased = (1 - Math.cos(Math.PI * progress)) / 2;
    window.scrollTo({ top: startY + (targetY - startY) * eased, behavior: 'instant' });
    if (progress < 1) {
      frame = requestAnimationFrame(step);
    } else {
      cancel();
    }
  }

  cancelScroll = cancel;
  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('touchstart', cancel, { passive: true });
  window.addEventListener('keydown', cancel);
  frame = requestAnimationFrame(step);
}

/**
 * Called at click time, before the pagination navigation starts.
 *
 * @param href - The pagination link's destination (`?page=N` or a full path).
 */
export function scheduleScrollToContent(href: string) {
  cancelScroll?.();
  if (scheduled) {
    document.body.style.minHeight = scheduled.bodyMinHeight;
  }

  const destination = new URL(href, window.location.href);
  scheduled = {
    pathname: destination.pathname,
    search: normalizedSearch(destination),
    bodyMinHeight: document.body.style.minHeight,
  };
  // Keep WebKit from clamping the bottom-of-page position during the brief
  // route handoff. The destination render releases this before scrolling.
  document.body.style.minHeight = `${document.documentElement.scrollHeight}px`;
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
    document.body.style.minHeight = scheduled.bodyMinHeight;
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

  const { bodyMinHeight } = scheduled;
  scheduled = null;
  // Lay the new page out while the height hold is still in place. This can
  // run in the same task as the commit that swapped the results in (e.g. for
  // signed-in users), before WebKit has laid the new DOM out. Releasing the
  // hold first makes that first layout clamp the scroll well above the
  // results — even though the finished page is as tall as the old one — so
  // the smooth scroll then starts from there instead of from the bottom. A
  // call, not a bare property read, so the minifier can't drop it.
  results.getBoundingClientRect();
  document.body.style.minHeight = bodyMinHeight;
  // The destination's results or skeletons are laid out before scrolling, so
  // the target stays in place as the request completes.
  scrollToResults(results);
}
