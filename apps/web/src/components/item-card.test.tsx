import type { ComponentProps, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import type { Movie } from '@/types/movie';
import type { ProxyImageUrls } from '@/types/proxy-image';
import type { TvShow } from '@/types/tv-show';

import ItemCard from './item-card';

vi.mock('@/components/back-target-link', () => ({
  BackTargetLink({ href, children }: { href: string; children: ReactNode }) {
    return <a href={href}>{children}</a>;
  },
}));
vi.mock('@/components/client-image', () => ({
  default({
    fallbackSrc,
    alt,
    eager,
    imageUrls,
  }: {
    fallbackSrc: string;
    alt: string;
    eager: boolean;
    imageUrls?: ProxyImageUrls;
  }) {
    return (
      <span data-alt={alt} data-src={imageUrls?.src ?? fallbackSrc} data-eager={String(eager)} />
    );
  },
}));
vi.mock('@/components/quick-add-button', () => ({
  QuickAddButton({
    mediaId,
    mediaType,
    userId,
  }: {
    mediaId: number;
    mediaType: string;
    userId?: string;
  }) {
    return (
      <button type="button" data-media={mediaType} data-id={mediaId} data-user={userId}>
        Quick add
      </button>
    );
  },
}));
vi.mock('@/components/remove-from-list-button', () => ({
  RemoveFromListButton({
    listId,
    mediaId,
    mediaType,
  }: {
    listId: string;
    mediaId: number;
    mediaType: string;
  }) {
    return (
      <button type="button" data-list={listId} data-id={mediaId} data-media={mediaType}>
        Remove from list
      </button>
    );
  },
}));

const resource: Movie = {
  id: 42,
  title: 'Test movie',
  release_date: '2026-10-10',
  poster_path: '/poster.jpg',
  vote_average: 8.21,
  adult: false,
  backdrop_path: '',
  original_language: 'en',
  original_title: 'Test movie',
  overview: '',
  media_type: 'movie',
  genre_ids: [],
  popularity: 1,
  video: false,
  vote_count: 100,
};
function movie(overrides: Partial<ComponentProps<typeof ItemCard>> = {}) {
  return renderToStaticMarkup(<ItemCard resource={resource} type="movie" {...overrides} />);
}

describe('web poster card presentation', () => {
  it('preserves movie navigation, metadata, upward score rounding and quick actions', () => {
    const html = movie({ userId: 'user-1' });
    expect(html).toContain('href="/movie/42"');
    expect(html).toContain('Test movie');
    expect(html).toContain('2026');
    expect(html).toContain('>8.3<');
    expect(html).toContain('Quick add');
    expect(html).toContain('data-user="user-1"');
    expect(html).toContain('hover:border-yellow-300');
  });
  it('preserves TV navigation/badges and unknown date/artwork fallbacks', () => {
    const series: TvShow = {
      id: 7,
      name: 'Test series',
      original_name: 'Test series',
      overview: '',
      backdrop_path: '',
      genre_ids: [],
      popularity: 1,
      media_type: 'tv',
      origin_country: [],
      original_language: 'en',
      vote_count: 100,
      first_air_date: '',
      poster_path: null,
      vote_average: 0,
    };
    const html = movie({
      resource: series,
      type: 'tv',
    });
    expect(html).toContain('href="/tv/7"');
    expect(html).toContain('TV Show');
    expect(html).toContain('No Poster');
    expect(html).toContain('📺');
    expect(movie({ resource: { ...resource, poster_path: null } })).toContain('🎬');
    expect(html).toContain('N/A');
    expect(html).toContain('hover:border-red-500');
  });
  it('selects list removal instead of quick add for custom-list cards', () => {
    const html = movie({ listId: 'list-1', showListButton: false });
    expect(html).toContain('Remove from list');
    expect(html).toContain('data-list="list-1"');
    expect(html).not.toContain('Quick add');
    expect(movie({ showListButton: false })).not.toContain('Quick add');
  });
  it('keeps eager and proxy image data, and accepts already resolved image URLs', () => {
    const resolved = { ...resource, poster_path: 'https://images.example/poster.jpg' };
    expect(
      movie({
        resource: resolved,
        eagerImage: true,
      }),
    ).toContain('data-eager="true"');
    expect(movie({ resource: resolved })).toContain('data-src="https://images.example/poster.jpg"');
    const proxied = {
      ...resource,
      posterImageUrls: { src: 'https://images.example/proxy.jpg', srcSetAvif: '', srcSetWebp: '' },
    };
    expect(movie({ resource: proxied })).toContain('data-src="https://images.example/proxy.jpg"');
  });
});
