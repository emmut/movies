/**
 * Deterministic "go back" targets for detail pages (movie, tv, person).
 *
 * When the user clicks a link to a detail page, the URL they are on — including
 * query params like the search text or discover filters — is stored in
 * `sessionStorage`, keyed by the destination pathname. The detail page's back
 * button then navigates to that exact URL instead of guessing from the
 * `referer` header or browser history, both of which break after login
 * redirects or repeated searches.
 */

const KEY_PREFIX = 'back-target:';

function storageKey(pathname: string) {
  return KEY_PREFIX + pathname;
}

/** Strips query/hash from an href so keys always match `usePathname()`. */
function hrefToPathname(href: string) {
  const end = href.search(/[?#]/);
  return end === -1 ? href : href.slice(0, end);
}

/** Accepts only same-app paths (`/x`), rejecting external `//host` values. */
function isInternalPath(value: string | null): value is string {
  return value !== null && value.startsWith('/') && !value.startsWith('//');
}

/**
 * Records the current URL (pathname + search) as the back target for the page
 * at {@link href}. Call this in the click handler of links to detail pages.
 */
export function saveBackTarget(href: string) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = window.location.pathname + window.location.search;
    window.sessionStorage.setItem(storageKey(hrefToPathname(href)), current);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); the back
    // button then falls back to its static default.
  }
}

/**
 * Returns the URL recorded for the detail page at {@link pathname}, or `null`
 * when nothing (or something unsafe) is stored — e.g. after a direct visit.
 */
export function getBackTarget(pathname: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(storageKey(pathname));
    return isInternalPath(stored) ? stored : null;
  } catch {
    return null;
  }
}
