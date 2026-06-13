import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

// Sentinel origin used only to resolve candidate redirect paths. Any value that
// resolves to a different origin is an off-origin redirect and gets rejected.
const REDIRECT_SENTINEL_ORIGIN = 'https://redirect.invalid';

/**
 * Checks if a URL is a safe same-origin relative redirect path.
 *
 * The value must start with '/' and, when resolved by the URL parser, stay on
 * the sentinel origin. Resolving with `URL` catches the bypasses a plain string
 * check misses: browsers normalize backslashes and strip control characters and
 * whitespace, so inputs like '/\\evil.com' would otherwise escape to an
 * attacker-controlled origin (CWE-601).
 */
export function isValidRedirectUrl(url?: string): boolean {
  if (!url || typeof url !== 'string' || !url.startsWith('/')) {
    return false;
  }

  try {
    return new URL(url, REDIRECT_SENTINEL_ORIGIN).origin === REDIRECT_SENTINEL_ORIGIN;
  } catch {
    return false;
  }
}

/**
 * Returns the given URL if it is a safe relative redirect path; otherwise, returns '/'.
 *
 * A URL is considered safe if it starts with a single '/' and does not contain protocol or domain indicators.
 *
 * @returns The validated redirect URL or '/' if the input is invalid or unsafe.
 */
export function getSafeRedirectUrl(url?: string) {
  return url && isValidRedirectUrl(url) ? url : '/';
}

/**
 * Generates a login URL, optionally including a redirect parameter if the provided URL is a safe relative path.
 *
 * @param redirectUrl - The URL to redirect to after login, included only if it is a valid relative path
 * @returns The login URL with an optional redirect parameter, or '/' if the redirect URL is invalid
 */
export function createLoginUrl(redirectUrl?: string) {
  if (redirectUrl === undefined || !isValidRedirectUrl(redirectUrl)) {
    return '/';
  }
  return `/login?redirect_url=${encodeURIComponent(redirectUrl)}`;
}

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
