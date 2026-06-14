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
// The blank page is the deterministic signal: if hydration unmounts the tree,
// these always-present shell headings disappear and the assertions fail. We
// also fail on a hydration/React crash surfaced as an uncaught page error.
test('home page survives hydration on reload (no blank landing page)', async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on('pageerror', (error) => {
    if (/insertBefore|Minified React error|hydrat/i.test(error.message)) {
      hydrationErrors.push(error.message);
    }
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /trending now/i })).toBeVisible();

  // Reload twice to exercise the hydration path that previously crashed.
  for (let i = 0; i < 2; i++) {
    await page.reload({ waitUntil: 'networkidle' });
    // Shell headings are part of the prerendered output; a hydration unmount
    // would wipe them, so visibility here means the tree stayed mounted.
    await expect(page.getByRole('heading', { name: /trending now/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /movies in theaters/i })).toBeVisible();
  }

  expect(hydrationErrors, `unexpected hydration errors:\n${hydrationErrors.join('\n')}`).toEqual([]);
});
