import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/components/image-proxy', () => ({ Imgproxy: () => null }));

import { TvSeasons } from './tv-seasons';

describe('TV seasons', () => {
  it('keeps season cards free of scroll snapping', () => {
    const html = renderToStaticMarkup(
      <TvSeasons
        tvId={1}
        seasons={[
          {
            id: 1,
            name: 'Season 1',
            season_number: 1,
            episode_count: 10,
            poster_path: null,
            air_date: null,
          },
        ]}
        next={null}
        latest={null}
      />,
    );
    expect(html).toContain('href="/tv/1/season/1"');
    expect(html).not.toContain('snap-start');
  });

  it('hides missing episode data', () => {
    const html = renderToStaticMarkup(
      <TvSeasons tvId={1} seasons={[]} next={null} latest={null} />,
    );
    expect(html).not.toContain('Next Episode');
    expect(html).not.toContain('Latest Episode');
  });
});
