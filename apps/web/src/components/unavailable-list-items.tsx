'use client';

import { Button } from '@movies/ui/components/button';

/** Missing upstream titles are not an empty saved list and must remain retryable. */
export function UnavailableListItems({ count, retry }: { count: number; retry: () => void }) {
  if (count === 0) {
    return null;
  }
  return (
    <output className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border p-4">
      <span>
        {count} saved {count === 1 ? 'title couldn’t' : 'titles couldn’t'} load.
      </span>
      <Button variant="outline" onClick={retry}>
        Try again
      </Button>
    </output>
  );
}
