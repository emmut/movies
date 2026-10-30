import { expect, test } from '@playwright/test';

test('collection movies keep the originating movie as their back destination', async ({ page }) => {
  await page.goto('/movie/603');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible();
  const sourceTitle = (await heading.textContent())!.trim();
  const collection = page.getByRole('heading', { name: 'The Matrix Collection', exact: true }).locator('..');
  const relatedMovie = collection.getByRole('link').first();
  const destination = await relatedMovie.getAttribute('href');
  const destinationTitle = await relatedMovie.locator('p').first().innerText();
  await relatedMovie.click();
  await page.waitForURL((url) => url.pathname === destination);
  await expect(heading).toHaveText(destinationTitle);

  await page.getByRole('button', { name: 'Go back to previous page' }).click();
  await page.waitForURL((url) => url.pathname === '/movie/603');
  await expect(heading).toHaveText(sourceTitle);
});

test('season spoiler controls preserve individual, partial, and all-episode selection', async ({ page }) => {
  await page.goto('/tv/1668/season/1');
  const revealFirst = page.getByRole('button', { name: 'Reveal episode 1 details', exact: true });
  const revealButtons = page.getByRole('button', { name: /^Reveal episode \d+ details$/ });
  const hideButtons = page.getByRole('button', { name: /^Hide episode \d+ details$/ });
  await expect(revealFirst).toBeVisible();
  const episodeCount = await revealButtons.count();
  expect(episodeCount).toBeGreaterThan(1);
  await revealFirst.click();
  await expect(page.getByRole('button', { name: 'Hide episode 1 details', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: 'Reveal episode 2 details', exact: true })).toHaveAttribute('aria-expanded', 'false');

  await page.getByRole('button', { name: 'Show spoilers', exact: true }).click();
  await expect(hideButtons).toHaveCount(episodeCount);
  await page.getByRole('button', { name: 'Hide episode 1 details', exact: true }).click();
  await expect(hideButtons).toHaveCount(episodeCount - 1);
  await page.getByRole('button', { name: 'Show spoilers', exact: true }).click();
  await expect(hideButtons).toHaveCount(episodeCount);
  await page.getByRole('button', { name: 'Hide spoilers', exact: true }).click();
  await expect(revealButtons).toHaveCount(episodeCount);
  await expect(hideButtons).toHaveCount(0);
});
