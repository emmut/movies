import { IMAGE_CDN_URL } from '@/lib/constants';

export function formatDateYear(date: string) {
  return date.split('-')?.[0];
}

export function formatImageUrl(path: string | null, width = 500) {
  if (path === null) {
    return '';
  }
  return `${IMAGE_CDN_URL}w${width}${path}`;
}

export function formatCurrency(amount: number, withSymbol = true) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: withSymbol ? 'symbol' : 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a count in compact notation for tight UI spots, e.g. 30755 → "30.8K"
 * and 3206008 → "3.2M".
 */
export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

/**
 * Removes duplicate items by ID from an array and sorts the result by descending popularity and date.
 *
 * Items with the same ID are deduplicated, keeping the first occurrence. Sorting is performed first by the `popularity` property in descending order, then by date (as extracted by `getDateString`) in descending order. If a date is missing or invalid, it defaults to "1900-01-01".
 *
 * @param items - The array of items to process
 * @param getDateString - Function that returns a date string for each item
 * @returns An array of unique items sorted by popularity and date
 */
export function deduplicateAndSortByPopularity<T extends { id: number; popularity: number }>(
  items: T[],
  getDateString: (item: T) => string,
): T[] {
  return items
    .filter((item, index, self) => index === self.findIndex((i) => i.id === item.id))
    .sort((a, b) => {
      // Sort by popularity first, then by date
      if (b.popularity !== a.popularity) {
        return b.popularity - a.popularity;
      }
      return (
        new Date(getDateString(b) || '1900-01-01').getTime() -
        new Date(getDateString(a) || '1900-01-01').getTime()
      );
    });
}

export { createLoginUrl, getSafeRedirectUrl, isValidRedirectUrl } from '@movies/auth/redirect';

/**
 * Extracts a user-facing message from a caught value.
 *
 * Returns the `Error`'s message when the thrown value is an `Error`; otherwise
 * falls back to the provided default (caught values are `unknown` and may be
 * anything).
 *
 * @param error - The caught value
 * @param fallback - Message to use when `error` is not an `Error`
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
