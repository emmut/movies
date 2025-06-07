'use server';

import { fetchAvailableGenres } from './movies';
import { fetchAvailableTvGenres } from './tv-shows';

export async function validateGenreForMediaType(
  genreId: string,
  mediaType: 'movie' | 'tv'
): Promise<boolean> {
  try {
    const availableGenres =
      mediaType === 'movie'
        ? await fetchAvailableGenres()
        : await fetchAvailableTvGenres();

    return availableGenres.some((genre) => genre.id.toString() === genreId);
  } catch (error) {
    console.warn('Failed to validate genre for media type:', error);
    return true; // Return true on error to keep existing genre
  }
}
