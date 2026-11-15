import { parseSearchQuery } from '@movies/api/parse-search-query';
import type { SearchItem, SearchPage } from '@movies/api/search';

import type { ProxyImageUrls } from '@/types/proxy-image';

export type SearchCommandItem = {
  key: string;
  href: string;
  title: string;
  subtitle: string;
  badge: 'Movie' | 'TV Show' | 'Person';
  badgeVariant: 'yellow' | 'red' | 'blue';
  imageUrls?: ProxyImageUrls;
  fallbackSrc: string;
  fallbackEmoji: string;
};

/**
 * Maps validated search results to command-palette rows, capped at the requested limit.
 *
 * @param data - The search page, or undefined while nothing has loaded
 * @param limit - Maximum number of rows to return
 */
export function toSearchCommandItems(data: SearchPage | undefined, limit = 8): SearchCommandItem[] {
  return (data?.items ?? []).slice(0, limit).map(toApiSearchCommandItem);
}

/**
 * Builds the "see all results" link for a palette query. A media-type keyword
 * in the query ("heat movie") preselects the matching tab on /search.
 */
export function buildSeeAllHref(query: string): string {
  const mediaType = parseSearchQuery(query).mediaType ?? 'all';
  return `/search?q=${encodeURIComponent(query)}&mediaType=${mediaType}`;
}

/**
 * Resolves where Enter should navigate: the selected row when the visible
 * results actually belong to the current query, otherwise the full search
 * page for the typed query, or nowhere when the input is empty.
 *
 * `resultsAreFresh` guards against `keepPreviousData`: while a new query's
 * debounce/fetch is pending, `items` still holds the previous query's rows
 * and Enter must not open one of those.
 */
export function getSubmitHref(
  items: SearchCommandItem[],
  index: number,
  resultsAreFresh: boolean,
  seeAllHref: string,
  hasQuery: boolean,
): string | null {
  const item = resultsAreFresh ? items[index] : undefined;

  if (item) {
    return item.href;
  }

  return hasQuery ? seeAllHref : null;
}

export type PaletteQuerySync = {
  query: string;
  activeIndex: number;
  syncedUrlQuery: string;
};

/**
 * Decides whether the palette's typed draft should be reset to the URL's `q`
 * value. The draft must not follow the URL on every render (typing doesn't
 * write to the URL), only when `q` itself changes elsewhere — e.g. browser
 * back/forward while the palette stays open — which `syncedUrlQuery` (the
 * last URL value the draft was reset to) detects. Returns `null` when nothing
 * needs to change, so the caller can skip the state updates entirely.
 */
export function syncPaletteQuery(
  urlQuery: string,
  syncedUrlQuery: string,
): PaletteQuerySync | null {
  if (urlQuery === syncedUrlQuery) {
    return null;
  }

  return { query: urlQuery, activeIndex: 0, syncedUrlQuery: urlQuery };
}

/**
 * Returns the next selected index for a keyboard event, wrapping at both ends.
 * Keys other than ArrowDown/ArrowUp leave the selection unchanged.
 */
export function moveSelection(key: string, index: number, count: number): number {
  if (count === 0) {
    return 0;
  }

  if (key === 'ArrowDown') {
    return (index + 1) % count;
  }

  if (key === 'ArrowUp') {
    return (index - 1 + count) % count;
  }

  return index;
}

const TITLE_PRESENTATION = {
  movie: { badge: 'Movie', badgeVariant: 'yellow', fallbackEmoji: '🎬' },
  tv: { badge: 'TV Show', badgeVariant: 'red', fallbackEmoji: '📺' },
} as const satisfies Record<
  'movie' | 'tv',
  Pick<SearchCommandItem, 'badge' | 'badgeVariant' | 'fallbackEmoji'>
>;

function toApiSearchCommandItem(item: SearchItem): SearchCommandItem {
  if (item.type === 'person') {
    return {
      key: `person-${item.id}`,
      href: `/person/${item.id}`,
      title: item.name,
      subtitle: item.department,
      badge: 'Person',
      badgeVariant: 'blue',
      fallbackSrc: item.profileUrl ?? '',
      fallbackEmoji: '👤',
    };
  }

  return {
    key: `${item.type}-${item.id}`,
    href: `/${item.type}/${item.id}`,
    title: item.title,
    subtitle: item.releaseDate.slice(0, 4),
    ...TITLE_PRESENTATION[item.type],
    fallbackSrc: item.posterUrl ?? '',
  };
}
