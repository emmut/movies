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
