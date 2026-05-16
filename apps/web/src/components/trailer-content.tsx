'use client';

import { useQuery } from '@tanstack/react-query';

import { orpc } from '@/utils/orpc';

import { TrailerButton } from './trailer-button';

type TrailerContentProps = {
  mediaType: 'movie' | 'tv';
  mediaId: number;
  title: string;
};

export function TrailerContent({ mediaType, mediaId, title }: TrailerContentProps) {
  const { data: trailerKey } = useQuery(
    mediaType === 'movie'
      ? orpc.movies.trailer.queryOptions({ input: { movieId: mediaId } })
      : orpc.tv.trailer.queryOptions({ input: { tvId: mediaId } }),
  );

  if (!trailerKey) return null;

  return <TrailerButton trailerKey={trailerKey} title={title} mediaType={mediaType} />;
}
