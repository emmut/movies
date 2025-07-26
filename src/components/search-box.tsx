'use client';

import { Button } from '@/components/ui/button';
import SearchIcon from '@/icons/SearchIcon';
import { MediaType } from '@/types/media-type';
import { Search } from 'lucide-react';

type SearchBoxProps = {
  mediaType?: MediaType;
  autoFocus?: boolean;
};

export default function SearchBox({
  mediaType = 'all',
  autoFocus = false,
}: SearchBoxProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12">
      <div className="mb-6">
        <Search className="h-16 w-16 text-zinc-400" />
      </div>

      <h3 className="mb-4 text-xl font-semibold text-zinc-300">
        Start your search
      </h3>

      <p className="mb-6 text-center text-zinc-400">
        Enter a search term to find movies, TV shows, and persons
      </p>

      <form className="w-full max-w-md" action="/search">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-3 pr-4 pl-10 text-zinc-200 placeholder-zinc-500 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
              name="q"
              type="search"
              spellCheck={false}
              placeholder="Search for movies, TV shows, or people..."
              autoComplete="off"
              autoCorrect="off"
              autoFocus={autoFocus}
            />
          </div>
          <Button type="submit" size="lg" className="p-6">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <input type="hidden" name="mediaType" value={mediaType} />
      </form>
    </div>
  );
}
