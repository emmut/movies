const DEFAULT_BACK_HREF = '/discover';

/**
 * Resolves the detail-page back button target from the request's `referer`
 * header. Known in-app origins map to an explicit href — search keeps its
 * query, discover keeps its filters — and everything else (no referer,
 * another site, login/auth redirects) falls back to /discover. The button
 * always pushes this static href instead of walking browser history, which
 * broke after login redirects and repeated searches.
 *
 * @param referer - The raw `referer` request header, if any.
 * @param host - The request's `host` header; a referer from another host is
 *   ignored so we never mirror foreign URLs into navigation.
 */
export function getBackHref(referer: string | null, host: string | null): string {
  if (!referer) {
    return DEFAULT_BACK_HREF;
  }

  let url: URL;
  try {
    url = new URL(referer);
  } catch {
    return DEFAULT_BACK_HREF;
  }

  if (host === null || url.host !== host) {
    return DEFAULT_BACK_HREF;
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
      return url.pathname + url.search;
    // Anything else — login, auth callbacks, unknown routes — gets the
    // static default rather than a guess.
    default:
      return DEFAULT_BACK_HREF;
  }
}
