'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { validateGenreForMediaType } from '@/lib/media-actions';
import { Film, Search, Tv, User } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';

type MediaType = 'movie' | 'tv' | 'person' | 'all';

type MediaTypeSelectorDropdownProps = {
  currentMediaType: MediaType;
};

/**
 * Renders a dropdown selector for choosing between media types.
 *
 * Updates the URL query parameters and navigates to reflect the selected media type. If a genre is selected that is not valid for the new media type, it is removed from the query parameters.
 *
 * @param currentMediaType - The currently selected media type.
 * @param includePersons - Whether to show the persons option. Defaults to false.
 * @param includeAll - Whether to show the all option. Defaults to false.
 */
export default function MediaTypeSelectorDropdown({
  currentMediaType,
}: MediaTypeSelectorDropdownProps) {
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

  return (
    <Select
      value={optimisticMediaType}
      onValueChange={(value) => handleMediaTypeChange(value as MediaType)}
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
