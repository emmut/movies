'use client';

import { validateGenreForMediaType } from '@/lib/media-actions';
import { Film, Search, Tv, User } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';

type MediaType = 'movie' | 'tv' | 'person' | 'all';

type MediaTypeSelectorProps = {
  currentMediaType: MediaType;
  includePersons?: boolean;
  includeAll?: boolean;
};

/**
 * Renders a toggle component for selecting between media types.
 *
 * Updates the URL query parameters and navigates to reflect the selected media type. If a genre is selected that is not valid for the new media type, it is removed from the query parameters.
 *
 * @param currentMediaType - The currently selected media type.
 * @param includePersons - Whether to show the persons option. Defaults to false.
 */
export default function MediaTypeSelector({
  currentMediaType,
  includePersons = false,
  includeAll = false,
}: MediaTypeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [optimisticMediaType, setOptimisticMediaType] =
    useOptimistic(currentMediaType);
  const [, startTransition] = useTransition();

  async function handleMediaTypeChange(mediaType: MediaType) {
    const params = new URLSearchParams(searchParams);
    const currentGenreId = params.get('genreId');

    startTransition(() => {
      setOptimisticMediaType(mediaType);
    });

    if (mediaType === 'all') {
      params.delete('mediaType');
    } else {
      params.set('mediaType', mediaType);
    }
    params.delete('page');

    if (currentGenreId && mediaType !== 'person' && mediaType !== 'all') {
      const genreExists = await validateGenreForMediaType(
        currentGenreId,
        mediaType as 'movie' | 'tv'
      );

      if (!genreExists) {
        params.delete('genreId');
      }
    } else if (mediaType === 'person' || mediaType === 'all') {
      // Persons and mixed results don't have genres, so remove genreId
      params.delete('genreId');
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="bg-muted/60 flex rounded-lg p-1">
      {includeAll && (
        <button
          onClick={() => handleMediaTypeChange('all')}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            optimisticMediaType === 'all'
              ? 'bg-white text-black'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Search className="h-4 w-4" />
          All
        </button>
      )}
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
      {includePersons && (
        <button
          onClick={() => handleMediaTypeChange('person')}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            optimisticMediaType === 'person'
              ? 'bg-white text-black'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <User className="h-4 w-4" />
          Persons
        </button>
      )}
    </div>
  );
}
