import { PassThrough } from 'node:stream';

import { type ReactNode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/movies', () => ({ getMovieWatchProviders: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ getTvShowWatchProviders: vi.fn() }));
vi.mock('@/lib/wikidata', () => ({ getWikidataWatchLinks: vi.fn() }));
vi.mock('@/lib/apple-catalogue', () => ({ getAppleCatalogueLinks: vi.fn() }));
vi.mock('@/lib/watch-link-fallbacks', () => ({ getMarketFallbackWatchLinks: vi.fn() }));
vi.mock('@/lib/tmdb', () => ({
  optional: async (promise: Promise<unknown>, fallback: unknown) => promise.catch(() => fallback),
}));
vi.mock('@/components/streaming-providers', () => ({
  StreamingProviders: ({
    watchProviders,
    directLinks = [],
  }: {
    watchProviders: { results: Record<string, unknown> };
    directLinks?: DirectWatchLink[];
  }) => (
    <section>
      <span>{Object.keys(watchProviders.results).join(',') || 'No services available'}</span>
      <a href={directLinks[0]?.url ?? 'https://www.themoviedb.org/movie/123/watch'}>
        {directLinks.length ? 'Watch on Netflix' : 'View options on TMDB'}
      </a>
    </section>
  ),
}));

import { getAppleCatalogueLinks } from '@/lib/apple-catalogue';
import { getMovieWatchProviders } from '@/lib/movies';
import { getTvShowWatchProviders } from '@/lib/tv-shows';
import { getMarketFallbackWatchLinks } from '@/lib/watch-link-fallbacks';
import { getWikidataWatchLinks } from '@/lib/wikidata';
import type { DirectWatchLink } from '@/types/watch-provider';

import { StreamingSection } from './streaming-section';

const providers = { results: { US: { link: 'https://www.themoviedb.org/movie/123/watch' } } };
const links: DirectWatchLink[] = [
  { providerId: 8, types: ['flatrate'], url: 'https://www.netflix.com/title/80057281' },
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getMarketFallbackWatchLinks).mockImplementation(
    async (_context, _region, _providers, links) => links,
  );
});

describe('streaming section', () => {
  it('keeps local links visible while country fallbacks stream in', async () => {
    const provider = {
      provider_id: 2,
      provider_name: 'Apple TV Store',
      logo_path: '/logo.png',
      display_priority: 1,
    };
    vi.mocked(getMovieWatchProviders).mockResolvedValue({
      results: { SE: { link: 'https://www.themoviedb.org/movie/123/watch', buy: [provider] } },
    });
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([]);
    vi.mocked(getAppleCatalogueLinks).mockResolvedValue([]);
    const pending = Promise.withResolvers<import('@/types/watch-provider').ResolvedWatchLink[]>();
    vi.mocked(getMarketFallbackWatchLinks).mockReturnValue(pending.promise);
    const titleContext = {
      type: 'movie' as const,
      id: 123,
      title: 'Example',
      originalTitle: 'Example',
      releaseDate: '2024-01-01',
      homepage: null,
    };
    const stream = streamSection(
      await StreamingSection({
        resourceType: 'movie',
        resourceId: 123,
        userRegion: 'SE',
        searchParams: Promise.resolve({}),
        titleContext,
      }),
    );
    await stream.firstChunk;
    expect(stream.html()).toContain('View options on TMDB');
    const url = 'https://itunes.apple.com/us/movie/id1735930123';
    pending.resolve([
      {
        providerId: 2,
        types: ['buy'],
        regions: ['SE'],
        source: 'apple',
        fallbackRegion: 'US',
        url,
      },
    ]);
    await stream.complete;
    expect(stream.html()).toContain(url);
    expect(getMarketFallbackWatchLinks).toHaveBeenCalledWith(
      titleContext,
      'SE',
      expect.objectContaining({ buy: [provider] }),
      [],
    );
  });
  it('renders a reviewed homepage while Wikidata is pending', async () => {
    vi.mocked(getMovieWatchProviders).mockResolvedValue(providers);
    const pending = Promise.withResolvers<DirectWatchLink[]>();
    vi.mocked(getWikidataWatchLinks).mockReturnValue(pending.promise);
    const stream = streamSection(
      await StreamingSection({
        resourceType: 'movie',
        resourceId: 123,
        userRegion: 'US',
        searchParams: Promise.resolve({}),
        titleContext: {
          type: 'movie',
          id: 123,
          title: 'Example',
          originalTitle: 'Example',
          releaseDate: '2024-01-01',
          homepage: links[0].url,
        },
      }),
    );
    await stream.firstChunk;
    expect(stream.html()).toContain(links[0].url);
    pending.resolve([]);
    await stream.complete;
    expect(stream.html()).toContain(links[0].url);
    expect(getAppleCatalogueLinks).not.toHaveBeenCalled();
  });

  it('keeps existing links visible while an unresolved Apple store offer streams in for the selected country', async () => {
    const store = {
      provider_id: 2,
      provider_name: 'Apple TV Store',
      logo_path: '/logo.png',
      display_priority: 1,
    };
    vi.mocked(getMovieWatchProviders).mockResolvedValue({
      results: { SE: { link: 'https://www.themoviedb.org/movie/123/watch', buy: [store] } },
    });
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([]);
    const pending = Promise.withResolvers<DirectWatchLink[]>();
    vi.mocked(getAppleCatalogueLinks).mockReturnValue(pending.promise);
    const titleContext = {
      type: 'movie' as const,
      id: 123,
      title: 'Example',
      originalTitle: 'Example',
      releaseDate: '2024-01-01',
      homepage: null,
    };
    const stream = streamSection(
      await StreamingSection({
        resourceType: 'movie',
        resourceId: 123,
        userRegion: 'US',
        searchParams: Promise.resolve({ region: 'SE' }),
        titleContext,
      }),
    );
    await stream.firstChunk;
    expect(stream.html()).toContain('View options on TMDB');
    expect(getMarketFallbackWatchLinks).not.toHaveBeenCalled();
    const url = 'https://itunes.apple.com/se/movie/id1735930123';
    pending.resolve([{ providerId: 2, types: ['buy'], regions: ['SE'], url }]);
    await stream.complete;
    expect(getAppleCatalogueLinks).toHaveBeenCalledWith(titleContext, 'SE');
    expect(stream.html()).toContain(url);
  });

  it('does not query Apple when Wikidata already resolves the store offer', async () => {
    vi.mocked(getMovieWatchProviders).mockResolvedValue({
      results: {
        US: {
          link: 'https://www.themoviedb.org/movie/123/watch',
          buy: [
            { provider_id: 2, provider_name: 'Apple', logo_path: '/logo.png', display_priority: 1 },
          ],
        },
      },
    });
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([
      { providerId: 2, types: ['buy'], url: 'https://itunes.apple.com/us/movie/id1735930123' },
    ]);
    const stream = streamSection(
      await StreamingSection({
        resourceType: 'movie',
        resourceId: 123,
        userRegion: 'US',
        searchParams: Promise.resolve({}),
        titleContext: {
          type: 'movie',
          id: 123,
          title: 'Example',
          originalTitle: 'Example',
          releaseDate: '2024-01-01',
          homepage: null,
        },
      }),
    );
    await stream.complete;
    expect(getAppleCatalogueLinks).not.toHaveBeenCalled();
  });
  it.each(['movie', 'tv'] as const)(
    'shows %s availability before optional links settle, then streams direct links',
    async (resourceType) => {
      const getProviders =
        resourceType === 'movie' ? getMovieWatchProviders : getTvShowWatchProviders;
      vi.mocked(getProviders).mockResolvedValue(providers);
      const pending = Promise.withResolvers<DirectWatchLink[]>();
      vi.mocked(getWikidataWatchLinks).mockReturnValue(pending.promise);
      const section = await StreamingSection({
        resourceType,
        resourceId: 123,
        userRegion: 'US',
        titleContext: undefined,
        searchParams: Promise.resolve({}),
      });
      const stream = streamSection(section);
      await stream.shell;
      await stream.firstChunk;
      expect(getProviders).toHaveBeenCalledWith(123);
      expect(getWikidataWatchLinks).toHaveBeenCalledWith(resourceType, 123, 'US');
      expect(stream.html()).toContain('View options on TMDB');
      expect(stream.html()).toContain('US');
      expect(stream.html()).not.toContain(links[0].url);
      pending.resolve(links);
      await stream.complete;
      expect(stream.html()).toContain(links[0].url);
      expect(stream.html()).toContain('Watch on Netflix');
    },
  );

  it('keeps watch options usable when the optional lookup returns no links', async () => {
    vi.mocked(getMovieWatchProviders).mockResolvedValue(providers);
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([]);
    const stream = streamSection(
      await StreamingSection({
        resourceType: 'movie',
        resourceId: 123,
        userRegion: 'US',
        titleContext: undefined,
        searchParams: Promise.resolve({}),
      }),
    );
    await stream.complete;
    expect(stream.html()).toContain('View options on TMDB');
    expect(stream.html()).toContain('US');
  });

  it('preserves the availability fallback if TMDB fails', async () => {
    vi.mocked(getMovieWatchProviders).mockRejectedValue(new Error('unavailable'));
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([]);
    const stream = streamSection(
      await StreamingSection({
        resourceType: 'movie',
        resourceId: 1,
        userRegion: 'SE',
        titleContext: undefined,
        searchParams: Promise.resolve({}),
      }),
    );
    await stream.complete;
    expect(stream.html()).toContain('No services available');
  });
  it('refreshes the selected market instead of using the stored preference', async () => {
    vi.mocked(getMovieWatchProviders).mockResolvedValue(providers);
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([]);
    await StreamingSection({
      resourceType: 'movie',
      resourceId: 123,
      userRegion: 'US',
      titleContext: undefined,
      searchParams: Promise.resolve({ region: 'SE' }),
    });
    expect(getWikidataWatchLinks).toHaveBeenCalledWith('movie', 123, 'SE');
  });
  it.each(['invalid', ['SE', 'US']])(
    'ignores invalid/ambiguous region query values: %j',
    async (region) => {
      vi.mocked(getMovieWatchProviders).mockResolvedValue(providers);
      vi.mocked(getWikidataWatchLinks).mockResolvedValue([]);
      await StreamingSection({
        resourceType: 'movie',
        resourceId: 123,
        userRegion: 'US',
        titleContext: undefined,
        searchParams: Promise.resolve({ region }),
      });
      expect(getWikidataWatchLinks).toHaveBeenCalledWith('movie', 123, 'US');
    },
  );
});
