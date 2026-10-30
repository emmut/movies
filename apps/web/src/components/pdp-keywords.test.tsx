import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/pdp', () => ({ getPdpExtras: vi.fn() }));

import { getPdpExtras } from '@/lib/pdp';

import { KeywordBubbles } from './keyword-bubbles';
import { PdpKeywords } from './pdp-keywords';

beforeEach(() => vi.clearAllMocks());

describe('PDP keywords', () => {
  it.each(['movie', 'tv'] as const)(
    'renders %s keywords as collapsed silhouettes without an accordion',
    async (type) => {
      vi.mocked(getPdpExtras).mockResolvedValue({
        keywords:
          type === 'movie'
            ? { keywords: [{ id: 10, name: 'Time travel' }] }
            : { results: [{ id: 10, name: 'Time travel' }] },
      });

      const section = await PdpKeywords({ type, id: 1 });
      const html = renderToStaticMarkup(section);

      expect(getPdpExtras).toHaveBeenCalledWith(type, 1);
      expect(html).toContain(`/keyword/10?mediaType=${type}`);
      expect(html).toContain('Time travel');
      expect(html).toContain('Themes &amp; Keywords');
      expect(html).not.toContain('<details');
      expect(html).not.toContain('<summary');
      expect(section?.type).toBe(KeywordBubbles);
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('inert=""');
    },
  );

  it.each([{}, { keywords: { keywords: [] } }])(
    'hides absent or empty keywords',
    async (extras) => {
      vi.mocked(getPdpExtras).mockResolvedValue(extras);
      expect(await PdpKeywords({ type: 'movie', id: 1 })).toBeNull();
    },
  );

  it('keeps the main details available if the supplementary request fails', async () => {
    vi.mocked(getPdpExtras).mockRejectedValue(new Error('Unavailable'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await PdpKeywords({ type: 'tv', id: 1 })).toBeNull();

    log.mockRestore();
  });
});
