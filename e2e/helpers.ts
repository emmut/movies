import { expect, type Page } from '@playwright/test';

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

/**
 * Moves a lifted dnd-kit sortable card one slot later with ArrowRight, then
 * waits for the move to take effect before returning.
 *
 * dnd-kit's KeyboardSensor deliberately attaches its real keydown listener
 * via a zero-delay `setTimeout` when a drag starts, so the same keypress that
 * lifted the item (Space) isn't also processed as a move. Because
 * `aria-pressed` flips synchronously in that same lift, `expect(...).
 * toHaveAttribute('aria-pressed', 'true')` right after can resolve on its
 * very first (immediate) poll — without the event loop ever reaching that
 * `setTimeout`. Sending ArrowRight straight after such a callback-less lift
 * races the listener attachment: on a slow or busy runner, the keypress can
 * arrive before the listener exists and gets silently dropped, leaving the
 * card never displaced. Yielding one macrotask in the page guarantees the
 * `setTimeout(0)` has already run before the move key goes out.
 *
 * The keyboard sensor then handles key presses synchronously, but the
 * resulting `over` target and sibling shift transforms only land on the next
 * React commit. Dropping (Space) before that commit makes dnd-kit drop the
 * item in place, so callers must not drop until this resolves. The displaced
 * neighbor sliding left (a negative translate3d) is the observable signal
 * that the move committed.
 *
 * @param page - The Playwright page.
 * @param displacedTitle - Title of the card currently one slot after the
 *   lifted card, which the move shifts left.
 */
export async function keyboardMoveRight(page: Page, displacedTitle: string) {
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
  await page.keyboard.press('ArrowRight');
  await expect(
    page.locator('div[style*="translate3d"]').filter({ hasText: displacedTitle }),
  ).toHaveAttribute('style', /translate3d\(-/);
}
