import type { SearchMultiResult } from '@/lib/search';
import { formatDateYear, formatImageUrl } from '@/lib/utils';
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

type MultiResult = SearchMultiResult['results'][number];

function getImageUrls(result: object, field: 'posterImageUrls' | 'profileImageUrls') {
  return (result as Record<typeof field, ProxyImageUrls | undefined>)[field];
}

function toSearchCommandItem(result: MultiResult): SearchCommandItem | null {
  if (result.media_type === 'movie') {
    return {
      key: `movie-${result.id}`,
      href: `/movie/${result.id}`,
      title: result.title,
      subtitle: result.release_date ? formatDateYear(result.release_date) : '',
      badge: 'Movie',
      badgeVariant: 'yellow',
      imageUrls: getImageUrls(result, 'posterImageUrls'),
      fallbackSrc: formatImageUrl(result.poster_path, 92),
      fallbackEmoji: '🎬',
    };
  }

  if (result.media_type === 'tv') {
    return {
      key: `tv-${result.id}`,
      href: `/tv/${result.id}`,
      title: result.name,
      subtitle: result.first_air_date ? formatDateYear(result.first_air_date) : '',
      badge: 'TV Show',
      badgeVariant: 'red',
      imageUrls: getImageUrls(result, 'posterImageUrls'),
      fallbackSrc: formatImageUrl(result.poster_path, 92),
      fallbackEmoji: '📺',
    };
  }

  if (result.media_type === 'person') {
    return {
      key: `person-${result.id}`,
      href: `/person/${result.id}`,
      title: result.name,
      subtitle: result.known_for_department ?? '',
      badge: 'Person',
      badgeVariant: 'blue',
      imageUrls: getImageUrls(result, 'profileImageUrls'),
      fallbackSrc: formatImageUrl(result.profile_path, 92),
      fallbackEmoji: '👤',
    };
  }

  return null;
}

/**
 * Maps a multi-search response to command-palette rows, dropping unsupported
 * media types (e.g. collections) and capping the list.
 *
 * @param data - The multi search result, or undefined while nothing has loaded
 * @param limit - Maximum number of rows to return
 */
export function toSearchCommandItems(
  data: SearchMultiResult | undefined,
  limit = 8,
): SearchCommandItem[] {
  return (data?.results ?? [])
    .map(toSearchCommandItem)
    .filter((item): item is SearchCommandItem => item !== null)
    .slice(0, limit);
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
