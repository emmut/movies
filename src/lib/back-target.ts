import { saveBackScroll } from './back-scroll';
import { writeSessionStorageValue } from './session-storage';

/**
 * Deterministic "go back" targets for detail pages (movie, tv, person).
 *
 * When the user clicks a link to a detail page, the URL they are on — with
 * query params like the search text or discover filters — is stored in
 * `sessionStorage`, keyed by the destination pathname. The detail page's back
 * button navigates to that exact URL instead of guessing from the `referer`
 * header or browser history, both of which break after login redirects or
 * repeated searches. Callers that aren't a page themselves (the quick-search
 * palette) pass an explicit target instead.
 */

const KEY_PREFIX = 'back-target:';

/** Strips query/hash from an href so keys always match `usePathname()`. */
function hrefToPathname(href: string) {
  const end = href.search(/[?#]/);
  return end === -1 ? href : href.slice(0, end);
}

/** The storage key holding the back target for the page at {@link href}. */
export function backTargetKey(href: string) {
  return KEY_PREFIX + hrefToPathname(href);
}

/**
 * Records the back target for the page at {@link href}: the given
 * {@link target}, or the current URL (pathname + search) when omitted. Call
 * this when a navigation to a detail page starts.
 */
export function saveBackTarget(href: string, target?: string) {
  if (typeof window === 'undefined') {
    return;
  }

  if (target === undefined) {
    // The implicit target is the page the user is looking at right now —
    // record the reading position so the back button can restore it.
    saveBackScroll();
  }

  writeSessionStorageValue(
    backTargetKey(href),
    target ?? window.location.pathname + window.location.search,
  );
}

/**
 * Placeholder base for parsing app-relative paths with the `URL` constructor,
 * which refuses to parse a bare `/path` without one. Never requested and
 * independent of where the app is deployed — it exists only in memory during
 * parsing. A candidate that is a pure path keeps this origin after parsing,
 * so any other origin on the result means the candidate smuggled in a host.
 */
const PARSE_BASE_ORIGIN = 'http://internal';

/**
 * Validates an app-relative path as a back target. Returns the pathname +
 * query for known in-app routes, `null` for anything else — absolute URLs,
 * protocol-relative URLs, unknown routes.
 */
export function sanitizeBackHref(candidate: unknown) {
  if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(candidate, PARSE_BASE_ORIGIN);
  } catch {
    return null;
  }

  const path = url.pathname + url.search;

  // The URL parser treats `\` like `/`, so `/\evil.com/…` smuggles in an
  // authority despite starting with a single slash. Reject anything that
  // escaped the placeholder origin, and never return a protocol-relative
  // path — router.push would leave the site with either.
  if (url.origin !== PARSE_BASE_ORIGIN || path.startsWith('//')) {
    return null;
  }

  const section = url.pathname.split('/')[1];

  switch (section) {
    // Home and list pages: return with their full query string (search text,
    // discover filters, pagination) intact.
    case '':
    case 'search':
    case 'discover':
    case 'watchlist':
    case 'watched':
    case 'lists':
    // Detail pages: cast and recommendation navigation returns to the page
    // the user came from.
    case 'movie':
    case 'tv':
    case 'person':
      return path;
    default:
      return null;
  }
}
