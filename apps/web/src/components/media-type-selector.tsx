import { Film, Tv } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useOptimistic, useTransition } from 'react';

import { client } from '@/utils/orpc';

type MediaType = 'movie' | 'tv';

type MediaTypeSelectorProps = {
  currentMediaType: MediaType;
};

/**
 * Renders a toggle component for selecting between movie and TV media types.
 * Updates the URL search params when selection changes.
 */
export default function MediaTypeSelector({ currentMediaType }: MediaTypeSelectorProps) {
  const [optimisticMediaType, setOptimisticMediaType] = useOptimistic(currentMediaType);
  const [, startTransition] = useTransition();
  const navigate = useNavigate();

  async function handleMediaTypeChange(mediaType: MediaType) {
    startTransition(() => {
      setOptimisticMediaType(mediaType);
    });

    navigate({
      search: (prev: Record<string, unknown>) => {
        const currentGenreId = prev.genreId as number | undefined;

        // Optimistically clear genreId — validate asynchronously below
        const next = { ...prev, mediaType, genreId: undefined, page: 1 };

        if (currentGenreId && currentGenreId !== 0) {
          // Fire-and-forget validation; if genre is invalid we already cleared it
          client.discover.validateGenre({
            genreId: String(currentGenreId),
            mediaType,
          }).then((valid) => {
            if (valid) {
              navigate({
                search: (p: Record<string, unknown>) => ({
                  ...p,
                  mediaType,
                  genreId: currentGenreId,
                  page: 1,
                }),
              });
            }
          }).catch(() => {
            // Genre cleared already, ignore
          });
        }

        return next;
      },
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
