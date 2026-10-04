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
