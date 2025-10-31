'use client';

import { validateGenreForMediaType } from '@/lib/media-actions';
import { Film, Tv } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useOptimistic, useTransition } from 'react';

type MediaType = 'movie' | 'tv';

type MediaTypeSelectorProps = {
  currentMediaType: MediaType;
};

/**
 * Renders a toggle component for selecting between media types.
 *
 * Updates the URL query parameters and navigates to reflect the selected media type. If a genre is selected that is not valid for the new media type, it is removed from the query parameters.
 *
 * @param currentMediaType - The currently selected media type.
 */
export default function MediaTypeSelector({
  currentMediaType,
}: MediaTypeSelectorProps) {
  const [urlState, setUrlState] = useQueryStates({
    mediaType: parseAsString.withDefault('movie'),
    genreId: parseAsInteger.withDefault(0),
    page: parseAsString.withDefault('1'),
  });

  const [optimisticMediaType, setOptimisticMediaType] =
    useOptimistic(currentMediaType);
  const [, startTransition] = useTransition();

  async function handleMediaTypeChange(mediaType: MediaType) {
    startTransition(() => {
      setOptimisticMediaType(mediaType);
    });

    const currentGenreId = urlState.genreId;

    // Check if current genre is valid for new media type
    if (currentGenreId && currentGenreId !== 0) {
      const genreExists = await validateGenreForMediaType(
        String(currentGenreId),
        mediaType as 'movie' | 'tv'
      );

      if (!genreExists) {
        // Clear genre if it doesn't exist for new media type
        setUrlState({
          mediaType,
          genreId: 0,
          page: '1',
        });
        return;
      }
    }

    setUrlState({
      mediaType,
      page: '1',
    });
  }

  return (
    <div className="bg-muted/60 flex rounded-lg p-1">
      <button
        onClick={() => handleMediaTypeChange('movie')}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          optimisticMediaType === 'movie'
            ? 'bg-white text-black'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
        }`}
      >
        <Film className="h-4 w-4" />
        Movies
      </button>
      <button
        onClick={() => handleMediaTypeChange('tv')}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          optimisticMediaType === 'tv'
            ? 'bg-white text-black'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
        }`}
      >
        <Tv className="h-4 w-4" />
        TV Shows
      </button>
    </div>
  );
}
