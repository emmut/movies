'use client';

import { useDiscoveryOptions } from '@movies/api/react/use-discovery-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movies/ui/components/select';
import { Film, Search, Tv, User, type LucideIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';

import { useIsClient } from '@/hooks/use-is-client';

type MediaType = 'movie' | 'tv' | 'person' | 'all';

type MediaTypeSelectorDropdownProps = {
  currentMediaType: MediaType;
};

const mediaTypes = {
  all: { label: 'All', Icon: Search },
  movie: { label: 'Movies', Icon: Film },
  tv: { label: 'TV Shows', Icon: Tv },
  person: { label: 'Persons', Icon: User },
} satisfies Record<MediaType, { label: string; Icon: LucideIcon }>;

/** Navigates between media types, retaining genres supported by the destination catalog. */
export default function MediaTypeSelectorDropdown({
  currentMediaType,
}: MediaTypeSelectorDropdownProps) {
  const isClient = useIsClient();
  const movieOptions = useDiscoveryOptions({ type: 'movie' }, false);
  const tvOptions = useDiscoveryOptions({ type: 'tv' }, false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [optimisticMediaType, setOptimisticMediaType] = useOptimistic(currentMediaType);
  const [, startTransition] = useTransition();

  async function handleMediaTypeChange(mediaType: MediaType) {
    const params = new URLSearchParams(searchParams);

    startTransition(() => {
      setOptimisticMediaType(mediaType);
    });

    if (mediaType === 'all') {
      params.delete('mediaType');
    } else {
      params.set('mediaType', mediaType);
    }
    params.delete('page');

    if (mediaType === 'movie') {
      await preserveGenre(params, movieOptions);
    } else if (mediaType === 'tv') {
      await preserveGenre(params, tvOptions);
    } else {
      params.delete('genreId');
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function handleValueChange(value: MediaType | null) {
    if (value === null) {
      return;
    }
    void handleMediaTypeChange(value);
  }

  // Only render the dropdown after mounting to avoid hydration mismatch
  // from Radix UI's dynamic aria-controls IDs
  if (!isClient) {
    return (
      <div className="flex h-9 w-[180px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs">
        <div className="flex items-center gap-2">
          <MediaTypeLabel mediaType={currentMediaType} />
        </div>
      </div>
    );
  }

  return (
    <Select value={optimisticMediaType} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          <div className="flex items-center gap-2">
            <MediaTypeLabel mediaType={optimisticMediaType} />
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(mediaTypes).map(([value, { label, Icon }]) => (
          <SelectItem key={value} value={value}>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MediaTypeLabel({ mediaType }: { mediaType: MediaType }) {
  // Fall back for unexpected runtime values, e.g. an unknown URL parameter.
  const { label, Icon } = mediaTypes[mediaType] ?? mediaTypes.all;

  return (
    <>
      <Icon className="h-4 w-4" />
      {label}
    </>
  );
}

async function preserveGenre(
  params: URLSearchParams,
  query: ReturnType<typeof useDiscoveryOptions>,
) {
  const genreId = params.get('genreId');
  if (!genreId) {
    return;
  }
  const { data } = await query.refetch();
  // Keep the selection when upstream validation is temporarily unavailable.
  if (!data) {
    return;
  }

  const isSupportedGenre = data.genres.some((genre) => String(genre.id) === genreId);
  if (!isSupportedGenre) {
    params.delete('genreId');
  }
}
