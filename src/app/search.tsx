'use client';

import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export function Search() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const mediaType = searchParams.get('mediaType') ?? 'movie';

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
        defaultValue={q}
      />
      <input type="hidden" name="mediaType" value={mediaType} />
    </form>
  );
}
