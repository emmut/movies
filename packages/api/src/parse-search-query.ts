export type SearchQueryMediaType = 'movie' | 'tv' | 'person';

export type ParsedSearchQuery = {
  title: string;
  year?: number;
  mediaType?: SearchQueryMediaType;
};

// First film footage is from 1888; anything below that is a title fragment, not a year.
const MIN_YEAR = 1888;

const TRAILING_YEAR_PATTERN = /^(.*\S)\s+\(?(\d{4})\)?$/;

// Keyed by normalized token (lowercased, separators stripped, so "tv-show" and
// "tv show" both become "tvshow"). Ambiguous words that appear in real titles
// (bare "show", "people", "film") are deliberately absent — "The Truman Show"
// and "Ordinary People" must stay intact.
const MEDIA_TYPE_KEYWORDS = new Map<string, SearchQueryMediaType>([
  ['movi', 'movie'],
  ['movie', 'movie'],
  ['movies', 'movie'],
  ['tv', 'tv'],
  ['tvshow', 'tv'],
  ['tvshows', 'tv'],
  ['tvseries', 'tv'],
  ['person', 'person'],
  ['persons', 'person'],
]);

function extractTrailingYear(title: string, maxYear: number) {
  const match = TRAILING_YEAR_PATTERN.exec(title);

  if (!match) {
    return null;
  }

  const year = Number(match[2]);

  if (year < MIN_YEAR || year > maxYear) {
    return null;
  }

  return { title: match[1], year };
}

function normalizeKeyword(token: string) {
  // Strip separators only ("tv-show" → "tvshow"); digits must survive so a
  // two-token suffix like "1995 movie" cannot collapse into a bare keyword.
  return token.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchMediaTypeSuffix(tokens: string[], count: number) {
  // The keyword must leave a non-empty title in front of it.
  if (tokens.length <= count) {
    return null;
  }

  const mediaType = MEDIA_TYPE_KEYWORDS.get(normalizeKeyword(tokens.slice(-count).join('')));

  if (!mediaType) {
    return null;
  }

  return { title: tokens.slice(0, -count).join(' '), mediaType };
}

function extractTrailingMediaType(title: string) {
  const tokens = title.split(/\s+/);
  // Two-token suffixes ("tv show", "tv series") take priority over one-token.
  return matchMediaTypeSuffix(tokens, 2) ?? matchMediaTypeSuffix(tokens, 1);
}

function stripYearToken(parsed: ParsedSearchQuery, maxYear: number): ParsedSearchQuery | null {
  if (parsed.year !== undefined) {
    return null;
  }

  const match = extractTrailingYear(parsed.title, maxYear);
  return match ? { ...parsed, ...match } : null;
}

function stripMediaTypeToken(parsed: ParsedSearchQuery): ParsedSearchQuery | null {
  if (parsed.mediaType !== undefined) {
    return null;
  }

  const match = extractTrailingMediaType(parsed.title);
  return match ? { ...parsed, ...match } : null;
}

/**
 * Splits a free-text search query into a title plus optional trailing release
 * year and media-type keyword, in either order ("heat 1995 movie",
 * "heat movie 1995").
 *
 * A trailing 4-digit number (optionally parenthesized) is treated as a year
 * when it falls in a plausible release range and text precedes it, so
 * "heat 1995" and "heat (1995)" parse to a year filter while "1917" and
 * "2001: A Space Odyssey" stay intact. Future years beyond next year
 * (e.g. "Blade Runner 2049") are kept as part of the title.
 *
 * A trailing media-type keyword narrows the search: "movie"/"movies"/"movi",
 * "tv"/"tv show"/"tv-show"/"tvshow"/"tv series", "person"/"persons". Matching
 * is case-insensitive and ignores separators. The keyword must follow a
 * non-empty title.
 *
 * @param query - The raw search input
 * @param maxYear - Largest value treated as a year; defaults to next calendar year
 * @returns The title with recognized tokens stripped, plus year/mediaType when detected
 */
export function parseSearchQuery(
  query: string,
  maxYear = new Date().getFullYear() + 1,
): ParsedSearchQuery {
  let parsed: ParsedSearchQuery = { title: query.trim() };

  // Two passes: one year token and one media-type token, in either order.
  for (let pass = 0; pass < 2; pass++) {
    const next = stripYearToken(parsed, maxYear) ?? stripMediaTypeToken(parsed);

    if (!next) {
      break;
    }

    parsed = next;
  }

  return parsed;
}
