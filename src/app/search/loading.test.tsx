import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import Loading from './loading';

describe('search loading skeleton', () => {
  it('renders the complete result grid without a clipping container', () => {
    const markup = renderToStaticMarkup(<Loading />);
    const gridClassName = markup.match(/<div class="([^"]*mt-8 grid[^"]*)">/)?.[1];

    expect(markup.match(/aspect-2\/3/g)).toHaveLength(20);
    expect(gridClassName).toBeDefined();
    expect(gridClassName).not.toContain('max-h-[45vh]');
    expect(gridClassName).not.toContain('overflow-hidden');
  });

  it('reserves the loaded media-type selector dimensions', () => {
    const markup = renderToStaticMarkup(<Loading />);

    expect(markup).toContain('h-9');
    expect(markup).toContain('w-[180px]');
  });
});
