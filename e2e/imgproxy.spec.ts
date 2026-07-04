import { expect, test } from '@playwright/test';

import { MOVIE_PATH } from './helpers';

// imgproxy URLs are HMAC-signed with a shared key/salt. The signature covers
// the processing options *and* the source URL, so a client can only load the
// exact images the app signed — you can't point the proxy at a different source
// (or reprocess one) by editing the URL. These tests exercise that guarantee
// against the real imgproxy service.

test.describe('imgproxy URL signing', () => {
  test('serves signed images but rejects tampered or unsigned URLs', async ({ page, request }) => {
    await page.goto(MOVIE_PATH);

    // The detail page renders <Imgproxy> images whose src is a signed URL
    // ({endpoint}/{signature}/{options}/plain/{sourceUrl}) for the local proxy.
    const image = page.locator('img[src*="/plain/"]').first();
    await expect(image).toBeVisible({ timeout: 15_000 });
    const signedUrl = await image.getAttribute('src');
    expect(signedUrl, 'expected a signed imgproxy image on the page').toBeTruthy();

    // A correctly signed URL is served: imgproxy validates, fetches the source,
    // and returns a processed image.
    const okResponse = await request.get(signedUrl!);
    expect(okResponse.status()).toBe(200);
    expect(okResponse.headers()['content-type']).toMatch(/^image\//);

    const url = new URL(signedUrl!);
    const [signedPrefix, source] = url.pathname.split('/plain/');
    expect(source, 'signed URL should encode the source after /plain/').toBeTruthy();

    // Swap the source for a different image while keeping the signature. It's
    // still an allowed source, so only the signature check can reject it —
    // proving you can't format an image that wasn't the one that was signed.
    const tamperedUrl = `${url.origin}${signedPrefix}/plain/https://image.tmdb.org/t/p/original/tampered.jpg`;
    const tamperedResponse = await request.get(tamperedUrl);
    expect(tamperedResponse.ok()).toBeFalsy();
    expect(tamperedResponse.status()).toBe(403);

    // A hand-crafted URL with a bogus signature is likewise forbidden.
    const unsignedUrl = `${url.origin}/insecure/rs:fit:200:0/plain/https://image.tmdb.org/t/p/original/tampered.jpg`;
    const unsignedResponse = await request.get(unsignedUrl);
    expect(unsignedResponse.ok()).toBeFalsy();
    expect(unsignedResponse.status()).toBe(403);
  });
});
