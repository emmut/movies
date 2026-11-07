import { expect, test } from '@playwright/test';

for (const mode of ['native', 'bundled'] as const) {
  test(`emoji prefer ${mode} fonts and render in color in inherited and sans-serif text`, async ({
    page,
  }) => {
    await page.goto('/');

    if (mode === 'native') {
      const hasNativeEmoji = await page.evaluate(async () => {
        try {
          await new FontFace(
            'Native Emoji Probe',
            'local("Apple Color Emoji"), local("Segoe UI Emoji"), local("Noto Color Emoji")',
          ).load();
          return true;
        } catch {
          return false;
        }
      });
      test.skip(!hasNativeEmoji, 'No native color emoji font installed on this runner');
    }

    await page.evaluate(async (mode) => {
      for (const [id, className] of [
        ['emoji-inherited', ''],
        ['emoji-sans', 'font-sans'],
      ]) {
        const span = document.createElement('span');
        span.id = id;
        span.className = className;
        span.textContent = '🎬🍿😀';
        document.body.append(span);
        if (mode === 'bundled') {
          // Simulate a TV with no native color emoji fonts installed.
          span.style.fontFamily = getComputedStyle(span).fontFamily.replace(
            /"?(?:Apple Color Emoji|Segoe UI Emoji|Noto Color Emoji)"?,?\s*/g,
            '',
          );
        }
        await document.fonts.load(`24px ${getComputedStyle(span).fontFamily}`, span.textContent);
      }
      await document.fonts.ready;
    }, mode);

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
          expect.objectContaining({
            familyName:
              mode === 'bundled'
                ? 'Noto Color Emoji'
                : expect.stringMatching(/Apple Color Emoji|Segoe UI Emoji|Noto Color Emoji/),
            isCustomFont: mode === 'bundled',
          }),
        ]),
      );
    }
    await session.detach();

    const hasColor = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 100;
      const context = canvas.getContext('2d')!;
      context.font = `64px ${getComputedStyle(document.querySelector('#emoji-inherited')!).fontFamily}`;
      context.fillText('😀', 0, 70);
      const { data } = context.getImageData(0, 0, 100, 100);
      for (let i = 0; i < data.length; i += 4) {
        if (
          data[i + 3] > 128 &&
          Math.max(data[i], data[i + 1], data[i + 2]) -
            Math.min(data[i], data[i + 1], data[i + 2]) >
            30
        ) {
          return true;
        }
      }
      return false;
    });
    expect(hasColor).toBe(true);
  });
}
