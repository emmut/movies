import { Film, Search, Tv, User } from 'lucide-react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useOptimistic, useTransition } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movies/ui/components/select';
import { useIsMounted } from '@movies/ui/hooks/use-is-mounted';
import { client } from '@/utils/orpc';

type MediaType = 'movie' | 'tv' | 'person' | 'all';

type MediaTypeSelectorDropdownProps = {
  currentMediaType: MediaType;
};

/**
 * Renders a dropdown selector for choosing between media types.
 *
 * Updates the URL query parameters and navigates to reflect the selected media type. If a genre is
 * selected that is not valid for the new media type, it is removed from the query parameters.
 */
export default function MediaTypeSelectorDropdown({
  currentMediaType,
}: MediaTypeSelectorDropdownProps) {
  const isMounted = useIsMounted();
  const navigate = useNavigate();
  const location = useLocation();
  const [optimisticMediaType, setOptimisticMediaType] = useOptimistic(currentMediaType);
  const [, startTransition] = useTransition();

  async function handleMediaTypeChange(mediaType: MediaType) {
    startTransition(() => {
      setOptimisticMediaType(mediaType);
    });

    // Parse current search params from the URL
    const searchParams = new URLSearchParams(location.searchStr ?? '');
    const currentGenreId = searchParams.get('genreId');

    if (mediaType === 'all') {
      searchParams.delete('mediaType');
    } else {
      searchParams.set('mediaType', mediaType);
    }
    searchParams.delete('page');

    if (currentGenreId && mediaType !== 'person' && mediaType !== 'all') {
      // Validate genre on the server via oRPC
      try {
        const genreExists = await client.discover.validateGenre({
          genreId: currentGenreId,
          mediaType: mediaType as 'movie' | 'tv',
        });
        if (!genreExists) {
          searchParams.delete('genreId');
        }
      } catch {
        searchParams.delete('genreId');
      }
    } else if (mediaType === 'person' || mediaType === 'all') {
      searchParams.delete('genreId');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ search: Object.fromEntries(searchParams.entries()) as any });
  }

  function getDisplayName(mediaType: MediaType) {
    switch (mediaType) {
      case 'all':
        return 'All';
      case 'movie':
        return 'Movies';
      case 'tv':
        return 'TV Shows';
      case 'person':
        return 'Persons';
      default:
        return 'All';
    }
  }

  function getIcon(mediaType: MediaType) {
    switch (mediaType) {
      case 'all':
        return <Search className="h-4 w-4" />;
      case 'movie':
        return <Film className="h-4 w-4" />;
      case 'tv':
        return <Tv className="h-4 w-4" />;
      case 'person':
        return <User className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  }

  if (!isMounted) {
    return (
      <div className="flex h-9 w-[180px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs">
        <div className="flex items-center gap-2">
          {getIcon(currentMediaType)}
          {getDisplayName(currentMediaType)}
        </div>
      </div>
    );
  }

  return (
    <Select
      value={optimisticMediaType}
      onValueChange={(value) => value && handleMediaTypeChange(value as MediaType)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          <div className="flex items-center gap-2">
            {getIcon(optimisticMediaType)}
            {getDisplayName(optimisticMediaType)}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            All
          </div>
        </SelectItem>
        <SelectItem value="movie">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            Movies
          </div>
        </SelectItem>
        <SelectItem value="tv">
          <div className="flex items-center gap-2">
            <Tv className="h-4 w-4" />
            TV Shows
          </div>
        </SelectItem>
        <SelectItem value="person">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Persons
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
