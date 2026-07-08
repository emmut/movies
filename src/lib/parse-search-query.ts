export type ParsedSearchQuery = {
  title: string;
  year?: number;
};

// First film footage is from 1888; anything below that is a title fragment, not a year.
const MIN_YEAR = 1888;

const TRAILING_YEAR_PATTERN = /^(.*\S)\s+\(?(\d{4})\)?$/;

/**
 * Splits a free-text search query into a title and an optional trailing release year.
 *
 * A trailing 4-digit number (optionally parenthesized) is treated as a year when it
 * falls in a plausible release range and text precedes it, so "heat 1995" and
 * "heat (1995)" both parse to a year filter while "1917" and "2001: A Space Odyssey"
 * stay intact. Future years beyond next year (e.g. "Blade Runner 2049") are kept as
 * part of the title.
 *
 * @param query - The raw search input
 * @param maxYear - Largest value treated as a year; defaults to next calendar year
 * @returns The title with the year stripped, and the year when one was detected
 */
export function parseSearchQuery(
  query: string,
  maxYear = new Date().getFullYear() + 1,
): ParsedSearchQuery {
  const trimmed = query.trim();
  const match = TRAILING_YEAR_PATTERN.exec(trimmed);

  if (!match) {
    return { title: trimmed };
  }

  const year = Number(match[2]);

  if (year < MIN_YEAR || year > maxYear) {
    return { title: trimmed };
  }

  return { title: match[1], year };
}
