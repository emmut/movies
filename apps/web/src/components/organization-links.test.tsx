import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vite-plus/test';

import { OrganizationLinks } from './organization-links';

it('links every TV network to its Discover filter', () => {
  const html = renderToStaticMarkup(
    <OrganizationLinks
      items={[
        { id: 49, name: 'HBO' },
        { id: 213, name: 'Netflix' },
      ]}
      type="tv"
      kind="network"
    />,
  );
  expect(html).toContain('/discover?networkId=49&amp;mediaType=tv');
  expect(html).toContain('/discover?networkId=213&amp;mediaType=tv');
  expect(html).toContain('HBO</a>');
  expect(html).toContain('Netflix</a>');
});
it('hides missing networks', () => {
  expect(renderToStaticMarkup(<OrganizationLinks items={[]} type="tv" kind="network" />)).toBe('');
});
