import { z } from 'zod';

import type { DirectWatchLink, WatchTitleContext } from '@/types/watch-provider';

const movieSchema = z.object({
  wrapperType: z.literal('track'),
  kind: z.literal('feature-movie'),
  trackId: z.number().int().positive(),
  trackName: z.string(),
  artistName: z.string(),
  releaseDate: z.iso.datetime({ offset: true }),
  trackViewUrl: z.url(),
});
const seasonSchema = z.object({
  wrapperType: z.literal('collection'),
  collectionType: z.literal('TV Season'),
  artistName: z.string(),
  collectionName: z.string(),
  releaseDate: z.iso.datetime({ offset: true }),
  artistViewUrl: z.url(),
});

function normalized(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function titleMatches(value: string, context: WatchTitleContext) {
  const year = context.releaseDate.slice(0, 4);
  const title = normalized(value.replace(new RegExp(`\\s*\\(${year}\\)$`), ''));
  return [context.title, context.originalTitle].some(
    (name) => normalized(name) === title && title.length > 0,
  );
}

function yearMatches(date: string, context: WatchTitleContext) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(context.releaseDate) &&
    date.slice(0, 4) === context.releaseDate.slice(0, 4)
  );
}

function directorMatches(artist: string, directors: string[]) {
  const names = artist.split(/\s+(?:&|and)\s+|[,;/]/).map(normalized);
  return directors.some(
    (director) => normalized(director).length > 0 && names.includes(normalized(director)),
  );
}

function catalogueUrl(value: string, kind: 'movie' | 'tv-show', region: string, trackId?: number) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
  const country = region.toLowerCase();
  if (url.hostname === 'itunes.apple.com') {
    const id = url.pathname.match(
      new RegExp(`^/${country}/${kind}/(?:[^/]+/)?id([1-9]\\d{5,15})/?$`),
    )?.[1];
    if (!id || (trackId !== undefined && id !== String(trackId))) return null;
    return `https://itunes.apple.com/${country}/${kind}/id${id}`;
  }
  if (kind === 'movie' && url.hostname === 'tv.apple.com') {
    const id = url.pathname.match(
      new RegExp(`^/${country}/movie/(?:[^/]+/)?(umc\\.cmc\\.[a-z0-9]{22,25})/?$`),
    )?.[1];
    return id ? `https://tv.apple.com/${country}/movie/${id}` : null;
  }
  return null;
}

function movieDestination(
  raw: unknown,
  context: WatchTitleContext,
  region: string,
  directors: string[],
) {
  const parsed = movieSchema.safeParse(raw);
  if (!parsed.success) return null;
  const movie = parsed.data;
  if (!titleMatches(movie.trackName, context) || !yearMatches(movie.releaseDate, context))
    return null;
  if (!directorMatches(movie.artistName, directors)) return null;
  return catalogueUrl(movie.trackViewUrl, 'movie', region, movie.trackId);
}

function showDestination(raw: unknown, context: WatchTitleContext, region: string) {
  const parsed = seasonSchema.safeParse(raw);
  if (!parsed.success) return null;
  const season = parsed.data;
  if (!titleMatches(season.artistName, context) || !yearMatches(season.releaseDate, context))
    return null;
  if (
    !/(?:season|säsong|saison|staffel|temporada|stagione|kausi|sesong|sæson)\s*1\s*$/i.test(
      season.collectionName,
    )
  )
    return null;
  // An episode/season result must not become the destination for an entire TV show.
  return catalogueUrl(season.artistViewUrl, 'tv-show', region);
}

/** Conservative matching: one exact work and storefront; never maps a store result to Apple TV subscription. */
export function buildAppleCatalogueLinks(
  data: unknown,
  context: WatchTitleContext,
  region: string,
  directors: string[],
): DirectWatchLink[] {
  if (!/^[A-Z]{2}$/.test(region) || !/^\d{4}-\d{2}-\d{2}$/.test(context.releaseDate)) return [];
  const root = z.object({ results: z.array(z.unknown()).max(200) }).safeParse(data);
  if (!root.success) return [];
  const urls = [
    ...new Set(
      root.data.results.flatMap((raw) => {
        const url =
          context.type === 'movie'
            ? movieDestination(raw, context, region, directors)
            : showDestination(raw, context, region);
        return url ? [url] : [];
      }),
    ),
  ];
  return urls.length === 1
    ? [{ providerId: 2, regions: [region], types: ['rent', 'buy'], url: urls[0] }]
    : [];
}
