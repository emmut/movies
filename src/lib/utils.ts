import { IMAGE_CDN_URL } from '@/lib/constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
export function deduplicateAndSortByPopularity<
  T extends { id: number; popularity: number },
>(items: T[], getDateString: (item: T) => string): T[] {
  return items
    .filter(
      (item, index, self) => index === self.findIndex((i) => i.id === item.id)
    )
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

/**
 * Checks if a URL is a safe relative redirect path.
 *
 * Returns true only if the input is a string that starts with a single slash ('/'), does not contain '://', and does not start with '//'.
 */
export function isValidRedirectUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Must start with '/' and not contain protocol or domain
  return url.startsWith('/') && !url.includes('://') && !url.startsWith('//');
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
