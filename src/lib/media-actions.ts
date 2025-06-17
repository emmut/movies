'use server';

import { fetchAvailableGenres } from './tmdb';
import { fetchAvailableTvGenres } from './tv-shows';

/**
 * Checks if a given genre ID is valid for the specified media type.
 *
 * @param genreId - The genre ID to validate.
 * @param mediaType - The media type to check against, either 'movie' or 'tv'.
 * @returns `true` if the genre ID exists for the given media type, otherwise `false`.
 *
 * @remark If an error occurs during validation, the function logs a warning and returns `true` as a fallback.
 */
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
    return true;
  }
}
