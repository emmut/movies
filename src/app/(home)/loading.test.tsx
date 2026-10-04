import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/quick-add-button', () => ({ QuickAddButton: () => null }));
vi.mock('@/components/remove-from-list-button', () => ({ RemoveFromListButton: () => null }));

import Loading from './loading';

describe('home loading skeleton', () => {
  it('renders the complete homepage shell', () => {
    const markup = renderToStaticMarkup(<Loading />);

    expect(markup.match(/<section/g)).toHaveLength(7);
    expect(markup.match(/data-slot="home-trending-skeleton"/g)).toHaveLength(2);
    expect(markup.match(/data-slot="home-media-section-skeleton"/g)).toHaveLength(6);
    expect(markup.match(/data-slot="item-card-skeleton"/g)).toHaveLength(120);
  });

  it('shows meaningful card content placeholders', () => {
    const markup = renderToStaticMarkup(<Loading />);

    expect(markup.match(/data-slot="trending-title-skeleton"/g)).toHaveLength(2);
    expect(markup.match(/data-slot="trending-year-skeleton"/g)).toHaveLength(2);
    expect(markup.match(/data-slot="item-card-title-skeleton"/g)).toHaveLength(120);
    expect(markup.match(/data-slot="item-card-metadata-skeleton"/g)).toHaveLength(120);
    expect(markup).not.toContain('opacity-0');
  });
});
