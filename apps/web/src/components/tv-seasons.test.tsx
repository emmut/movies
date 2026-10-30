import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/components/image-proxy', () => ({ Imgproxy: () => null }));

import { TvSeasons } from './tv-seasons';

describe('TV seasons', () => {
  it('hides missing episode data', () => {
    const html = renderToStaticMarkup(
      <TvSeasons tvId={1} seasons={[]} next={null} latest={null} />,
    );
    expect(html).not.toContain('Next Episode');
    expect(html).not.toContain('Latest Episode');
  });
});
