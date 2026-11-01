import { PassThrough } from 'node:stream';

import { type ReactNode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/movies', () => ({ getMovieWatchProviders: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ getTvShowWatchProviders: vi.fn() }));
vi.mock('@/lib/wikidata', () => ({ getWikidataWatchLinks: vi.fn() }));
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

import { getMovieWatchProviders } from '@/lib/movies';
import { getTvShowWatchProviders } from '@/lib/tv-shows';
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

beforeEach(() => vi.clearAllMocks());

describe('streaming section', () => {
  it.each(['movie', 'tv'] as const)(
    'shows %s availability before optional links settle, then streams direct links',
    async (resourceType) => {
      const getProviders =
        resourceType === 'movie' ? getMovieWatchProviders : getTvShowWatchProviders;
      vi.mocked(getProviders).mockResolvedValue(providers);
      const pending = Promise.withResolvers<DirectWatchLink[]>();
      vi.mocked(getWikidataWatchLinks).mockReturnValue(pending.promise);
      const section = await StreamingSection({ resourceType, resourceId: 123, userRegion: 'US' });
      const stream = streamSection(section);
      await stream.shell;
      await stream.firstChunk;
      expect(getProviders).toHaveBeenCalledWith(123);
      expect(getWikidataWatchLinks).toHaveBeenCalledWith(resourceType, 123);
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
      await StreamingSection({ resourceType: 'movie', resourceId: 123, userRegion: 'US' }),
    );
    await stream.complete;
    expect(stream.html()).toContain('View options on TMDB');
    expect(stream.html()).toContain('US');
  });

  it('preserves the availability fallback if TMDB fails', async () => {
    vi.mocked(getMovieWatchProviders).mockRejectedValue(new Error('unavailable'));
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([]);
    const stream = streamSection(
      await StreamingSection({ resourceType: 'movie', resourceId: 1, userRegion: 'SE' }),
    );
    await stream.complete;
    expect(stream.html()).toContain('No services available');
  });
});
