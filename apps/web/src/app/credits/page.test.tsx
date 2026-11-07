import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';

import { Footer } from '@/components/footer';

import CreditsPage from './page';

describe('data attribution', () => {
  it('keeps the TMDB logo and required notice in a credits section', () => {
    const html = renderToStaticMarkup(<CreditsPage />);
    expect(html).toContain('/tmdb-logo.svg');
    expect(html).toContain(
      'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    );
    expect(html).toContain('href="https://www.themoviedb.org"');
    expect(html).toContain('JustWatch');
    expect(html).toContain('Wikidata');
    expect(html).toContain('CC0');
    expect(html).toContain('IMDb');
  });

  it('makes credits discoverable from the application footer', () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).toContain('href="/credits"');
    expect(html).toContain(
      'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    );
  });
});
