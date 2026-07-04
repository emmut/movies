import { type Page } from '@playwright/test';

// A stable TMDB movie id used across the logged-in specs. Inception (27205) has
// long existed and won't 404, so the detail page renders deterministically.
export const MOVIE_ID = 27205;
export const MOVIE_PATH = `/movie/${MOVIE_ID}`;

/**
 * Signs in as a fresh anonymous user via the login page's "Continue as
 * anonymous" button. Each call mints a brand-new anonymous account, so tests
 * stay isolated even when run in parallel.
 *
 * @param page - The Playwright page.
 * @param redirectTo - Where to land after sign-in (defaults to home).
 */
export async function signInAnonymously(page: Page, redirectTo = '/') {
  const loginUrl =
    redirectTo === '/' ? '/login' : `/login?redirect_url=${encodeURIComponent(redirectTo)}`;
  await page.goto(loginUrl);

  await page.getByRole('button', { name: /continue as anonymous/i }).click();

  // The client redirects away from /login once the session cookie is set.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
}
