'use client';

import type { Genre } from '@/types/genre';
import { Film, Tv } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useOptimistic, useTransition } from 'react';

type MediaType = 'movie' | 'tv';

type MediaTypeSelectorProps = {
  currentMediaType: MediaType;
  movieGenres?: Genre[];
  tvGenres?: Genre[];
};

type MediaTypeUrlUpdate = {
  mediaType: MediaType;
  genreId?: number;
  page: '1';
};

type MediaTypeButtonProps = {
  active: boolean;
  label: string;
  mediaType: MediaType;
  onSelect: (mediaType: MediaType) => void;
};

export function getMediaTypeUrlUpdate(
  mediaType: MediaType,
  currentGenreId: number,
  movieGenres?: Genre[],
  tvGenres?: Genre[],
): MediaTypeUrlUpdate {
  const targetGenres = mediaType === 'movie' ? movieGenres : tvGenres;
  if (currentGenreId === 0 || !targetGenres) {
    return { mediaType, page: '1' };
  }

  return {
    mediaType,
    genreId: targetGenres.some((genre) => genre.id === currentGenreId) ? undefined : 0,
    page: '1',
  };
}

function MediaTypeButton({ active, label, mediaType, onSelect }: MediaTypeButtonProps) {
  const Icon = mediaType === 'movie' ? Film : Tv;

  return (
    <button
      onClick={() => onSelect(mediaType)}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

/**
 * Renders a toggle component for selecting between media types.
 *
 * Updates the URL query parameters and navigates to reflect the selected media type. If a genre is selected that is not valid for the new media type, it is removed from the query parameters.
 *
 * @param currentMediaType - The currently selected media type.
 */
export default function MediaTypeSelector({
  currentMediaType,
  movieGenres,
  tvGenres,
}: MediaTypeSelectorProps) {
  const [urlState, setUrlState] = useQueryStates(
    {
      mediaType: parseAsString.withDefault('movie'),
      genreId: parseAsInteger.withDefault(0),
      page: parseAsString.withDefault('1'),
    },
    {
      history: 'push',
    },
  );

  const [optimisticMediaType, setOptimisticMediaType] = useOptimistic(currentMediaType);
  const [, startTransition] = useTransition();

  function handleMediaTypeChange(mediaType: MediaType) {
    startTransition(() => {
      setOptimisticMediaType(mediaType);
    });

    setUrlState(getMediaTypeUrlUpdate(mediaType, urlState.genreId, movieGenres, tvGenres));
  }

  return (
    <div className="bg-muted/60 flex rounded-lg p-1">
      <MediaTypeButton
        active={optimisticMediaType === 'movie'}
        label="Movies"
        mediaType="movie"
        onSelect={handleMediaTypeChange}
      />
      <MediaTypeButton
        active={optimisticMediaType === 'tv'}
        label="TV Shows"
        mediaType="tv"
        onSelect={handleMediaTypeChange}
      />
    </div>
  );
}
