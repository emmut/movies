import { expect, test } from '@playwright/test';

// Regression guard for the blank-landing-page bug (commit 7e06cad): in a
// production build the homepage returned full HTML, then a cacheComponents
// streaming-hydration crash ("insertBefore: new child contains the parent")
// unmounted the whole React tree, leaving a blank page on reload.
//
// The homepage now prerenders default-region content and personalizes the
// region client-side after hydration, so its Suspense boundaries must stay
// prerendered (never server-streamed). This test reloads the page — the
// original repro condition — and asserts the content survives hydration.
//
// Signals: a hydration unmount wipes the always-present shell headings (the
// blank page), and the crash also surfaces as an uncaught page error. We assert
// the headings stay visible *after* giving hydration time to run, and that no
// hydration/React crash was thrown.
test('home page survives hydration on reload (no blank landing page)', async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on('pageerror', (error) => {
    if (/insertBefore|Minified React error|hydrat/i.test(error.message)) {
      hydrationErrors.push(error.message);
    }
  });

  const trendingHeading = page.getByRole('heading', { name: /trending now/i });
  const sectionHeading = page.getByRole('heading', { name: /movies in theaters/i });

  await page.goto('/');
  await expect(trendingHeading).toBeVisible();

  // Reload twice to exercise the hydration path that previously crashed.
  // Avoid waitUntil: 'networkidle' — analytics keep the network busy, so it
  // never settles; the default 'load' is enough and the assertions auto-wait.
  for (let i = 0; i < 2; i++) {
    await page.reload();
    await expect(trendingHeading).toBeVisible();
    await expect(sectionHeading).toBeVisible();
    // Give hydration time to run so a streamed-boundary crash would unmount the
    // tree before we re-assert the shell is still mounted.
    await page.waitForTimeout(1000);
    await expect(trendingHeading).toBeVisible();
    await expect(sectionHeading).toBeVisible();
  }

  expect(hydrationErrors, `unexpected hydration errors:\n${hydrationErrors.join('\n')}`).toEqual([]);
});
