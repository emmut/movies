import { getMovieTrailer } from '@/lib/movies';
import { getTvShowTrailer } from '@/lib/tv-shows';
import { Suspense } from 'react';
import { TrailerButton } from './trailer-button';

type TrailerContentProps = {
  mediaType: 'movie' | 'tv';
  mediaId: number;
  movieTitle: string;
};

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
