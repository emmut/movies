import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/hooks/use-has-pointer', () => ({ useHasPointer: () => true }));

import { ItemSlider } from './item-slider';

describe('ItemSlider', () => {
  it('starts without arrows or edge fades until overflow is measured', () => {
    const html = renderToStaticMarkup(
      <ItemSlider>
        <div>Item</div>
      </ItemSlider>,
    );
    expect(html).toContain('Item');
    expect(html).not.toContain('Previous slide');
    expect(html).not.toContain('Next slide');
    expect(html).not.toContain('slider-fade-');
  });
});
