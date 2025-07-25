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
 * Deduplicates an array of items by ID and sorts them by popularity (descending) then by date (descending).
 *
 * @param items - Array of items to deduplicate and sort
 * @param getDateString - Function to extract the date string from each item
 * @returns Deduplicated and sorted array
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
 * Validates that a redirect URL is safe to use (relative path only).
 * Prevents CSRF attacks by only allowing relative URLs starting with '/'.
 */
export function isValidRedirectUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Must start with '/' and not contain protocol or domain
  return url.startsWith('/') && !url.includes('://') && !url.startsWith('//');
}

/**
 * Gets a safe redirect URL, falling back to '/' if invalid.
 */
export function getSafeRedirectUrl(url?: string): string {
  return url && isValidRedirectUrl(url) ? url : '/';
}

/**
 * Creates a login URL with optional redirect parameter.
 * Only accepts relative URLs starting with '/' to prevent CSRF attacks.
 */
export function createLoginUrl(redirectUrl?: string): string {
  if (redirectUrl === undefined || !isValidRedirectUrl(redirectUrl)) {
    return '/';
  }
  return `/login?redirect_url=${encodeURIComponent(redirectUrl)}`;
}
