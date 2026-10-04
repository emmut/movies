// Restores the reading position when the deterministic back button returns
// to a previously visited page (see `@/lib/back-target`). `router.push` is a
// forward navigation, so the browser does not restore scroll for it — without
// this, "go back" from a detail page landed at the page top.
//
// The position is recorded alongside the back target when the user clicks
// into a detail page, keyed by the URL it belongs to. `GoBack` schedules a
// restore before pushing and `BackScrollRestorer` consumes it once the
// navigation lands. Like `@/lib/scroll-to-content`, the schedule is scoped
// to its destination: a render anywhere else drops it.

import { readSessionStorageValue, writeSessionStorageValue } from './session-storage';

const KEY_PREFIX = 'back-scroll:';

/** Order-insensitive pathname + query identity for storage keys. */
function identityFrom(pathname: string, search: string) {
  const params = new URLSearchParams(search);
  params.sort();
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function currentIdentity() {
  return identityFrom(window.location.pathname, window.location.search);
}

/** Placeholder base for parsing app-relative hrefs; see `./back-target`. */
const PARSE_BASE_ORIGIN = 'http://internal';

type ScheduledRestore = {
  identity: string;
  top: number;
};

let scheduled: ScheduledRestore | null = null;

/** Records the current scroll position for the current URL. */
export function saveBackScroll() {
  if (typeof window === 'undefined') {
    return;
  }

  writeSessionStorageValue(KEY_PREFIX + currentIdentity(), String(Math.round(window.scrollY)));
}

/**
 * Clears any recorded position for {@link href}. Explicit back targets (the
 * quick-search palette) point at a page the user is not currently reading —
 * a position recorded on an earlier visit must not be restored for them.
 */
export function clearBackScroll(href: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const destination = new URL(href, PARSE_BASE_ORIGIN);
  writeSessionStorageValue(
    KEY_PREFIX + identityFrom(destination.pathname, destination.search),
    '0',
  );
}

/**
 * Schedules restoring the recorded position for {@link href}; call right
 * before pushing the back navigation. Returns whether a restore was
 * scheduled — when it was, the caller must push with `scroll: false`, or
 * Next's own navigation scroll resets the page to the top after the restore.
 */
export function scheduleBackScrollRestore(href: string) {
  const destination = new URL(href, PARSE_BASE_ORIGIN);
  const identity = identityFrom(destination.pathname, destination.search);
  const top = Number(readSessionStorageValue(KEY_PREFIX + identity));

  scheduled = Number.isFinite(top) && top > 0 ? { identity, top } : null;
  return scheduled !== null;
}

/**
 * Instantly restores the scheduled position if the current location is the
 * scheduled destination; otherwise drops the schedule. One-shot either way.
 */
export function restoreBackScrollIfScheduled() {
  if (!scheduled) {
    return;
  }

  const { identity, top } = scheduled;
  scheduled = null;

  if (currentIdentity() !== identity) {
    return;
  }

  window.scrollTo({ top, behavior: 'instant' });
}
