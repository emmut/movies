import { expect, test } from '@playwright/test';

test('emoji use the bundled font in inherited and explicit sans-serif text', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(async () => {
    for (const [id, className] of [
      ['emoji-inherited', ''],
      ['emoji-sans', 'font-sans'],
    ]) {
      const span = document.createElement('span');
      span.id = id;
      span.className = className;
      span.textContent = '🎬🍿😀';
      document.body.append(span);
      await document.fonts.load(`24px ${getComputedStyle(span).fontFamily}`, span.textContent);
    }
    await document.fonts.ready;
  });

  // Inspect the actual glyph provider, rather than just the CSS font stack:
  // a TV has no native emoji font to rescue a missing web-font fallback.
  const session = await page.context().newCDPSession(page);
  await session.send('DOM.enable');
  await session.send('CSS.enable');
  const { root } = await session.send('DOM.getDocument');
  for (const selector of ['#emoji-inherited', '#emoji-sans']) {
    const { nodeId } = await session.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector,
    });
    const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId });
    expect(fonts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ familyName: 'Noto Emoji', isCustomFont: true }),
      ]),
    );
  }
  await session.detach();
});
