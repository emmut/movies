import type { MovieWatchProviders } from '@movies/api/tmdb-types/movie';
import type { SearchedPerson } from '@movies/api/tmdb-types/person';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import PersonCard from './person-card';
import { StreamingProviders } from './streaming-providers';

vi.mock('nuqs', () => ({
  useQueryState: () => ['SE'],
  parseAsStringLiteral: () => ({ withDefault: () => undefined }),
}));
vi.mock('@/components/region-select', () => ({ RegionSelect: () => <span>Region picker</span> }));
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('@/components/back-target-link', () => ({
  BackTargetLink: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('@/components/client-image', () => ({
  default: ({ fallbackSrc, alt, eager }: { fallbackSrc: string; alt: string; eager: boolean }) => (
    <img src={fallbackSrc} alt={alt} data-eager={String(eager)} />
  ),
}));
vi.mock('@/components/quick-add-button', () => ({
  QuickAddButton: () => <button>Add to list</button>,
}));
vi.mock('@/components/remove-from-list-button', () => ({
  RemoveFromListButton: () => <button>Remove from list</button>,
}));

const person: SearchedPerson = {
  id: 7,
  name: 'Actor',
  profile_path: '/person.jpg',
  popularity: 10,
  known_for_department: 'Acting',
  known_for: [{ id: 42, title: 'Movie', media_type: 'movie' }],
};
describe('web catalog rendering after shared type migration', () => {
  it('retains person photo/name/department/known-for and authenticated actions', () => {
    const html = renderToStaticMarkup(<PersonCard person={person} userId="user" eagerImage />);
    expect(html).toContain('href="/person/7"');
    expect(html).toContain('Actor');
    expect(html).toContain('Acting');
    expect(html).toContain('Known for: Movie');
    expect(html).toContain('data-eager="true"');
    expect(html).toContain('Add to list');
  });
  it('retains missing-photo fallback and list removal without an authenticated add action', () => {
    const html = renderToStaticMarkup(
      <PersonCard
        person={{ ...person, profile_path: null, known_for: [] }}
        listId="list"
        showListButton={false}
      />,
    );
    expect(html).toContain('No Photo');
    expect(html).toContain('Remove from list');
    expect(html).not.toContain('Add to list');
    expect(html).not.toContain('Known for:');
  });
  it('renders all provider groups in order with regional links and attribution', () => {
    const provider = {
      provider_id: 8,
      provider_name: 'Service',
      logo_path: '/logo.jpg',
      display_priority: 0,
    };
    const watchProviders: MovieWatchProviders = {
      results: {
        SE: {
          link: 'https://example.com/watch',
          free: [provider],
          flatrate: [provider],
          rent: [provider],
          buy: [provider],
        },
      },
    };
    const html = renderToStaticMarkup(
      <StreamingProviders
        watchProviders={watchProviders}
        resourceId={42}
        resourceType="movie"
        userRegion="SE"
      />,
    );
    expect(html.match(/href="https:\/\/example.com\/watch"/g)).toHaveLength(4);
    expect(html.indexOf('>Free')).toBeLessThan(html.indexOf('>Streaming'));
    expect(html.indexOf('>Streaming')).toBeLessThan(html.indexOf('>Rent'));
    expect(html.indexOf('>Rent')).toBeLessThan(html.indexOf('>Buy'));
    expect(html).toContain('JustWatch');
    expect(html).toContain('TMDB API');
    expect(html).not.toContain('No services available');
  });
  it('uses the canonical watch URL when the region is absent and preserves the empty state', () => {
    const html = renderToStaticMarkup(
      <StreamingProviders
        watchProviders={{ results: {} }}
        resourceId={42}
        resourceType="tv"
        userRegion="SE"
      />,
    );
    expect(html).toContain('No services available for this region');
    expect(html).toContain('Region picker');
  });
});
