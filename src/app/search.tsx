'use client';

import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';

function getMediaType(pathname: string, searchParams: URLSearchParams) {
  if (!pathname.includes('search')) {
    return 'all';
  }

  return searchParams.get('mediaType') ?? 'all';
}

export function Search() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mediaType = getMediaType(pathname, searchParams);
  const q = searchParams.get('q') ?? '';

  return (
    <form action="/search" className="relative max-w-md flex-1">
      <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
      <Input
        type="search"
        placeholder="Search..."
        className="pl-8"
        name="q"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        defaultValue={q}
      />
      <input type="hidden" name="mediaType" value={mediaType} />
    </form>
  );
}
