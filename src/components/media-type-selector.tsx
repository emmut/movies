'use client';

import { Film, Tv } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type MediaType = 'movie' | 'tv';

type MediaTypeSelectorProps = {
  currentMediaType: MediaType;
};

export default function MediaTypeSelector({
  currentMediaType,
}: MediaTypeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleMediaTypeChange = (mediaType: MediaType) => {
    const params = new URLSearchParams(searchParams);
    params.set('mediaType', mediaType);
    params.delete('page'); // Reset to page 1 when changing media type
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex rounded-lg bg-zinc-800 p-1">
      <button
        onClick={() => handleMediaTypeChange('movie')}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          currentMediaType === 'movie'
            ? 'bg-zinc-700 text-white'
            : 'text-zinc-400 hover:text-white'
        }`}
      >
        <Film className="h-4 w-4" />
        Movies
      </button>
      <button
        onClick={() => handleMediaTypeChange('tv')}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          currentMediaType === 'tv'
            ? 'bg-zinc-700 text-white'
            : 'text-zinc-400 hover:text-white'
        }`}
      >
        <Tv className="h-4 w-4" />
        TV Shows
      </button>
    </div>
  );
}
