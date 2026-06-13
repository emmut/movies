import { beforeEach, describe, expect, it, vi } from 'vitest';

// Concrete env so the module-level consts capture deterministic values at import.
vi.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_IMGPROXY_ENDPOINT: 'https://imgproxy.test',
    NEXT_PUBLIC_IMGPROXY_BASE_URL: 'https://base.test/',
    IMGPROXY_KEY: 'deadbeef',
    IMGPROXY_SALT: 'cafe',
  },
}));

// Echo the relevant args so we can assert what was signed without depending on
// the real HMAC output.
vi.mock('@imgproxy/imgproxy-node', () => ({
  generateImageUrl: vi.fn(
    (args: {
      url: { value: string };
      options: { format: string; dpr: number; resize: { resizing_type: string } };
    }) =>
      `URL[fmt=${args.options.format};dpr=${args.options.dpr};rt=${args.options.resize.resizing_type};url=${args.url.value}]`,
  ),
}));

import { generateImageUrl } from '@imgproxy/imgproxy-node';

import { buildProxyImageUrls } from './imgproxy-url';

const mockedGenerate = vi.mocked(generateImageUrl);

// All `url.value` strings passed to generateImageUrl across calls.
function signedUrls() {
  return mockedGenerate.mock.calls.map((call) => (call[0] as { url: { value: string } }).url.value);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildProxyImageUrls source resolution', () => {
  it('prefixes a relative path with the base url (single trailing slash collapsed)', () => {
    buildProxyImageUrls('/poster.jpg', { width: 500 });
    expect(signedUrls()[0]).toBe('https://base.test/poster.jpg');
  });

  it('passes an absolute http(s) src through unchanged', () => {
    buildProxyImageUrls('http://cdn.example/a.jpg');
    expect(signedUrls()[0]).toBe('http://cdn.example/a.jpg');
  });

  it('escapes %, ? and @ in the source url', () => {
    buildProxyImageUrls('http://cdn.example/a b?x=1@2%3.jpg');
    // % first so already-escaped sequences are not double-counted.
    expect(signedUrls()[0]).toBe('http://cdn.example/a b%3Fx=1%402%253.jpg');
  });
});

describe('buildProxyImageUrls output shape', () => {
  it('returns webp@2 src plus 1x/2x avif and webp srcsets', () => {
    const result = buildProxyImageUrls('/p.jpg', { width: 500 });

    expect(result.src).toBe('URL[fmt=webp;dpr=2;rt=fit;url=https://base.test/p.jpg]');
    expect(result.srcSetAvif).toBe(
      'URL[fmt=avif;dpr=1;rt=fit;url=https://base.test/p.jpg] 1x, ' +
        'URL[fmt=avif;dpr=2;rt=fit;url=https://base.test/p.jpg] 2x',
    );
    expect(result.srcSetWebp).toBe(
      'URL[fmt=webp;dpr=1;rt=fit;url=https://base.test/p.jpg] 1x, ' +
        'URL[fmt=webp;dpr=2;rt=fit;url=https://base.test/p.jpg] 2x',
    );
    // src(webp2) + 2 avif + 2 webp = 5 signings.
    expect(mockedGenerate).toHaveBeenCalledTimes(5);
  });

  it('uses fill-down resizing when fill is set, fit otherwise', () => {
    const fit = buildProxyImageUrls('/p.jpg', { width: 100 });
    expect(fit.src).toContain('rt=fit');

    vi.clearAllMocks();

    const fill = buildProxyImageUrls('/p.jpg', { width: 100, fill: true });
    expect(fill.src).toContain('rt=fill-down');
  });
});
