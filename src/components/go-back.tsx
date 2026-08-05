'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from './ui/button';

type GoBackProps = {
  href: string;
};

/**
 * Back button for detail pages. Always pushes the given href — resolved
 * server-side from the referer via `getBackHref` — instead of walking browser
 * history, so the target stays predictable.
 */
export function GoBack({ href }: GoBackProps) {
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        router.push(href);
      }}
      className="inline-flex items-center gap-2 p-0 text-zinc-400 transition-colors hover:text-white"
      variant="link"
    >
      <ChevronLeft className="h-4 w-4" />
      Go back to previous page
    </Button>
  );
}
