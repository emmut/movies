import { PassThrough } from 'node:stream';

import { type ReactNode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/movies', () => ({ getMovieWatchProviders: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ getTvShowWatchProviders: vi.fn() }));
vi.mock('@/lib/provider-watch-links', () => ({ getProviderWatchOptions: vi.fn() }));
vi.mock('@/lib/tmdb', () => ({
  optional: async (promise: Promise<unknown>, fallback: unknown) => promise.catch(() => fallback),
}));
vi.mock('@/components/streaming-providers', () => ({
  StreamingProviders: ({
    watchProviders,
    directLinks = [],
    popcornTime,
  }: {
    watchProviders: { results: Record<string, unknown> };
    directLinks?: ResolvedWatchLink[];
    popcornTime?: PopcornTimeAvailability | null;
  }) => (
    <section>
      <span>{Object.keys(watchProviders.results).join(',') || 'No services available'}</span>
      <span>{popcornTime?.offers[0]?.providerName}</span>
      <a href={directLinks[0]?.url ?? 'https://www.themoviedb.org/movie/123/watch'}>
        {directLinks.length ? 'Watch on Netflix' : 'View options on TMDB'}
      </a>
    </section>
  ),
}));

import { getMovieWatchProviders } from '@/lib/movies';
import { getProviderWatchOptions } from '@/lib/provider-watch-links';
import { getTvShowWatchProviders } from '@/lib/tv-shows';
import type {
  PopcornTimeAvailability,
  ProviderWatchOptions,
  ResolvedWatchLink,
} from '@/types/watch-provider';

import { StreamingSection } from './streaming-section';

const providers = { results: { US: { link: 'https://www.themoviedb.org/movie/123/watch' } } };
const sectionProps = { resourceTitle: 'Title', searchParams: Promise.resolve({}) };
const links: ResolvedWatchLink[] = [
  {
    source: 'wikidata',
    providerId: 8,
    types: ['flatrate'],
    url: 'https://www.netflix.com/title/80057281',
  },
];

function streamSection(section: ReactNode) {
  const output = new PassThrough();
  let html = '';
  const firstChunk = new Promise<void>((resolve) => output.once('data', () => resolve()));
  output.on('data', (chunk) => {
    html += chunk.toString();
  });
  const complete = new Promise<void>((resolve, reject) => {
    output.on('end', resolve);
    output.on('error', reject);
  });
  const shell = new Promise<void>((resolve, reject) => {
    const stream = renderToPipeableStream(<main>{section}</main>, {
      onShellReady() {
        stream.pipe(output);
        resolve();
      },
      onShellError: reject,
      onError: reject,
    });
  });
  return { shell, firstChunk, complete, html: () => html };
}

beforeEach(() => vi.clearAllMocks());

describe('streaming section', () => {
  it.each(['movie', 'tv'] as const)(
    'shows %s availability before optional links settle, then streams direct links',
    async (resourceType) => {
      const getProviders =
        resourceType === 'movie' ? getMovieWatchProviders : getTvShowWatchProviders;
      vi.mocked(getProviders).mockResolvedValue(providers);
      const pending = Promise.withResolvers<ProviderWatchOptions>();
      vi.mocked(getProviderWatchOptions).mockReturnValue(pending.promise);
      const section = await StreamingSection({
        ...sectionProps,
        resourceType,
        resourceId: 123,
        userRegion: 'US',
      });
      const stream = streamSection(section);
      await stream.shell;
      await stream.firstChunk;
      expect(getProviders).toHaveBeenCalledWith(123);
      expect(getProviderWatchOptions).toHaveBeenCalledWith(resourceType, 123, 'Title', 'US');
      expect(stream.html()).toContain('View options on TMDB');
      expect(stream.html()).toContain('US');
      expect(stream.html()).not.toContain(links[0].url);
      pending.resolve({ directLinks: links, popcornTime: null });
      await stream.complete;
      expect(stream.html()).toContain(links[0].url);
      expect(stream.html()).toContain('Watch on Netflix');
    },
  );

  it('keeps watch options usable when the optional lookup returns no links', async () => {
    vi.mocked(getMovieWatchProviders).mockResolvedValue(providers);
    vi.mocked(getProviderWatchOptions).mockResolvedValue({ directLinks: [], popcornTime: null });
    const stream = streamSection(
      await StreamingSection({
        ...sectionProps,
        resourceType: 'movie',
        resourceId: 123,
        userRegion: 'US',
      }),
    );
    await stream.complete;
    expect(stream.html()).toContain('View options on TMDB');
    expect(stream.html()).toContain('US');
  });

  it('preserves the availability fallback if TMDB fails', async () => {
    vi.mocked(getMovieWatchProviders).mockRejectedValue(new Error('unavailable'));
    vi.mocked(getProviderWatchOptions).mockResolvedValue({ directLinks: [], popcornTime: null });
    const stream = streamSection(
      await StreamingSection({
        ...sectionProps,
        resourceType: 'movie',
        resourceId: 1,
        userRegion: 'SE',
      }),
    );
    await stream.complete;
    expect(stream.html()).toContain('No services available');
  });

  it('passes primary offers through even when TMDB availability fails', async () => {
    vi.mocked(getMovieWatchProviders).mockRejectedValue(new Error('unavailable'));
    vi.mocked(getProviderWatchOptions).mockResolvedValue({
      directLinks: [],
      popcornTime: {
        region: 'SE',
        offers: [
          {
            providerId: 'popcorntime::new',
            providerName: 'Independent service',
            via: null,
            logo: null,
            type: 'flatrate',
            url: 'https://popcorntime.app/go/3xK9mPv2bQ7nRtYs',
            source: 'popcorntime',
            availabilitySource: 'popcorntime',
          },
        ],
      },
    });
    const stream = streamSection(
      await StreamingSection({
        ...sectionProps,
        resourceType: 'movie',
        resourceId: 1,
        userRegion: 'SE',
      }),
    );
    await stream.complete;
    expect(stream.html()).toContain('Independent service');
  });

  it('resolves links for the URL-selected region instead of the stored preference', async () => {
    const se = { link: 'https://www.themoviedb.org/movie/123/watch?locale=SE' };
    vi.mocked(getMovieWatchProviders).mockResolvedValue({
      results: { ...providers.results, SE: se },
    });
    vi.mocked(getProviderWatchOptions).mockResolvedValue({ directLinks: [], popcornTime: null });
    await StreamingSection({
      ...sectionProps,
      resourceType: 'movie',
      resourceId: 123,
      userRegion: 'US',
      searchParams: Promise.resolve({ region: 'SE' }),
    });
    expect(getProviderWatchOptions).toHaveBeenCalledWith('movie', 123, 'Title', 'SE');
  });

  it.each(['invalid', ['SE', 'US']])(
    'ignores invalid/ambiguous country query values: %j',
    async (region) => {
      vi.mocked(getMovieWatchProviders).mockResolvedValue(providers);
      vi.mocked(getProviderWatchOptions).mockResolvedValue({ directLinks: [], popcornTime: null });
      await StreamingSection({
        ...sectionProps,
        resourceType: 'movie',
        resourceId: 123,
        userRegion: 'US',
        searchParams: Promise.resolve({ region }),
      });
      expect(getProviderWatchOptions).toHaveBeenCalledWith('movie', 123, 'Title', 'US');
    },
  );
});
