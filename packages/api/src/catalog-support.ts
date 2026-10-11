import { z } from 'zod';

import { catalogDetailInput } from './catalog';
import { mediaCardSchema } from './home';

export const catalogTitleInput = catalogDetailInput.omit({ region: true });
export type CatalogTitleInput = z.infer<typeof catalogTitleInput>;
export const catalogRelatedInput = catalogDetailInput.extend({
  kind: z.enum(['similar', 'recommendations']),
});
export type CatalogRelatedInput = z.infer<typeof catalogRelatedInput>;

export const youtubeKeySchema = z.string().regex(/^[a-zA-Z0-9_-]{11}$/);
export const trailerSchema = z.object({ key: youtubeKeySchema }).nullable();
export type Trailer = z.infer<typeof trailerSchema>;

export type TmdbVideo = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
  size: number;
  iso_639_1: string;
  iso_3166_1: string;
};
export type TmdbVideoResponse = { id: number; results: TmdbVideo[] };

/** Preserve TMDB order: the first playable YouTube Trailer or Teaser wins. */
export function pickYoutubeTrailer(videos: Pick<TmdbVideo, 'key' | 'site' | 'type'>[]) {
  const video = videos.find((item) => {
    const trailerType = item.type === 'Trailer' || item.type === 'Teaser';
    return trailerType && item.site === 'YouTube' && youtubeKeySchema.safeParse(item.key).success;
  });
  return video?.key ?? null;
}
export function trailerEmbedUrl(key: string) {
  const safeKey = youtubeKeySchema.parse(key);
  return `https://www.youtube.com/embed/${safeKey}?autoplay=1&playsinline=1`;
}

const watchProviderSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  logoUrl: z.string().url().nullable(),
});
export const providerGroupsSchema = z.object({
  link: z.string().url(),
  free: z.array(watchProviderSchema),
  streaming: z.array(watchProviderSchema),
  rent: z.array(watchProviderSchema),
  buy: z.array(watchProviderSchema),
});
export type ProviderGroups = z.infer<typeof providerGroupsSchema>;
export type WatchProviderCard = z.infer<typeof watchProviderSchema>;
export const relatedTitlesSchema = z.array(mediaCardSchema);
