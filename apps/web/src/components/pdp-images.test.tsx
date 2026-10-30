import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/pdp', () => ({ getPdpExtras: vi.fn() }));
vi.mock('@/lib/imgproxy-url', () => ({
  buildProxyImageUrls: (path: string, { width }: { width: number }) => ({
    src: `https://images.test/${width}${path}`,
    srcSetAvif: '',
    srcSetWebp: '',
  }),
}));

import { getPdpExtras } from '@/lib/pdp';

import { PdpImages } from './pdp-images';

beforeEach(() => vi.clearAllMocks());

describe('PDP image gallery', () => {
  it('opens images with local viewer buttons and defers full-size images until opened', async () => {
    vi.mocked(getPdpExtras).mockResolvedValue({
      images: {
        backdrops: [{ file_path: '/backdrop.jpg' }],
        posters: [{ file_path: '/poster.jpg' }],
      },
    });
    const html = renderToStaticMarkup(await PdpImages({ type: 'movie', id: 1, title: 'Title' }));
    expect(html).toContain('Open image 1 of 2');
    expect(html).toContain('Open image 2 of 2');
    expect(html).toContain('https://images.test/480/backdrop.jpg');
    expect(html).not.toContain('https://images.test/1920');
    expect(html).not.toContain('target="_blank"');
    expect(getPdpExtras).toHaveBeenCalledWith('movie', 1);
  });

  it('hides the gallery when no images are available', async () => {
    vi.mocked(getPdpExtras).mockResolvedValue({});
    expect(await PdpImages({ type: 'tv', id: 1, title: 'Title' })).toBeNull();
  });
});
