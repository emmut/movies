import { getMovieTrailer } from '@/lib/movies';
import { getTvShowTrailer } from '@/lib/tv-shows';
import { Suspense } from 'react';
import { TrailerButton } from './trailer-button';

type TrailerContentProps = {
  mediaType: 'movie' | 'tv';
  mediaId: number;
  movieTitle: string;
};

/**
 * Asynchronously fetches and displays a trailer button for a movie or TV show.
 *
 * Depending on the provided media type and ID, retrieves the trailer key and renders a `TrailerButton` component within a React `Suspense` boundary. Returns `null` if no trailer is available.
 *
 * @param mediaType - Specifies whether the media is a 'movie' or 'tv'
 * @param mediaId - The unique identifier for the movie or TV show
 * @param movieTitle - The title of the movie or TV show
 * @returns A JSX element containing the trailer button, or `null` if no trailer is found
 */
export async function TrailerContent({
  mediaType,
  mediaId,
  movieTitle,
}: TrailerContentProps) {
  const trailerData =
    mediaType === 'movie'
      ? await getMovieTrailer(mediaId)
      : await getTvShowTrailer(mediaId);

  if (!trailerData) {
    return null;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrailerButton trailerKey={trailerData} movieTitle={movieTitle} />
    </Suspense>
  );
}
