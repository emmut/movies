import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';

import { ProductionCompanies } from './production-companies';

const companies = [
  { id: 41077, name: 'A24', logo_path: null },
  { id: 2, name: 'Pixar', logo_path: null },
];

describe('PDP production company links', () => {
  it.each(['movie', 'tv'] as const)('links every %s company to its Discover filter', (type) => {
    const html = renderToStaticMarkup(<ProductionCompanies companies={companies} type={type} />);
    expect(html).toContain(`/discover?companyId=41077&amp;mediaType=${type}`);
    expect(html).toContain(`/discover?companyId=2&amp;mediaType=${type}`);
    expect(html).toContain('A24</a>');
    expect(html).toContain('<h3');
    expect(html).not.toContain('<section');
    expect(html).not.toContain('<img');
    expect(html).toContain('Pixar</a>');
  });
  it('hides the section when no companies are available', () => {
    expect(renderToStaticMarkup(<ProductionCompanies companies={[]} type="movie" />)).toBe('');
  });
});
