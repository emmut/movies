'use client';

import { Film, Search, Tv, User } from 'lucide-react';
import { useLocation, useRouter } from '@tanstack/react-router';
import { useOptimistic, useTransition } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { validateGenreForMediaType } from '@/lib/media-actions';

type MediaType = 'movie' | 'tv' | 'person' | 'all';

type MediaTypeSelectorDropdownProps = {
  currentMediaType: MediaType;
};

export default function MediaTypeSelectorDropdown({
  currentMediaType,
}: MediaTypeSelectorDropdownProps) {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { pathname, search } = useLocation();
  const [optimisticMediaType, setOptimisticMediaType] = useOptimistic(currentMediaType);
  const [, startTransition] = useTransition();

  async function handleMediaTypeChange(mediaType: MediaType) {
    const params = new URLSearchParams(search);
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
        mediaType as 'movie' | 'tv',
      );

      if (!genreExists) {
        params.delete('genreId');
      }
    } else if (mediaType === 'person' || mediaType === 'all') {
      params.delete('genreId');
    }

    router.navigate({ to: `${pathname}?${params.toString()}` });
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
