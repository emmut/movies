import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';

import { ProductionCompanies } from './production-companies';

describe('Production companies', () => {
  it('hides missing companies', () => {
    expect(renderToStaticMarkup(<ProductionCompanies companies={[]} />)).toBe('');
  });

  it('renders company names as a compact fact without logo cards', () => {
    const html = renderToStaticMarkup(
      <ProductionCompanies
        companies={[
          { id: 1, name: 'Studio One', logo_path: '/logo.png' },
          { id: 2, name: 'Studio Two', logo_path: null },
        ]}
      />,
    );
    expect(html).toContain('Studio One, Studio Two');
    expect(html).toContain('<h3');
    expect(html).not.toContain('<section');
    expect(html).not.toContain('<img');
  });
});
