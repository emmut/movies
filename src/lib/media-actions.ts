import { createServerFn } from '@tanstack/react-start';

import { CACHE_TAGS } from '@/lib/cache-tags';
import { invalidateCacheKey } from '@/lib/server-cache';

import { fetchAvailableGenres } from './movies';
import { fetchAvailableTvGenres } from './tv-shows';

export const validateGenreForMediaType = createServerFn()
  .inputValidator((data: { genreId: string; mediaType: 'movie' | 'tv' }) => data)
  .handler(async ({ data }) => {
    const { genreId, mediaType } = data;
    try {
      const availableGenres =
        mediaType === 'movie' ? await fetchAvailableGenres() : await fetchAvailableTvGenres();
      return availableGenres.some((genre) => genre.id.toString() === genreId);
    } catch (error) {
      console.warn('Failed to validate genre for media type:', error);
      return true;
    }
  });

export const revalidateGenresCache = createServerFn()
  .inputValidator((mediaType: 'movie' | 'tv') => mediaType)
  .handler(async ({ data: mediaType }) => {
    invalidateCacheKey(
      mediaType === 'movie' ? CACHE_TAGS.public.genres.movies : CACHE_TAGS.public.genres.tv,
    );
  });
