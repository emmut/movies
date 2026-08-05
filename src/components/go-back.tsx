'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useBackTarget } from '@/hooks/use-back-target';

import { Button } from './ui/button';

/**
 * Deterministic back button for detail pages. Navigates to the URL recorded
 * when the user clicked into this page (search with its query, discover with
 * its filters, another detail page) instead of walking browser history —
 * which broke after login redirects and repeated searches. Falls back to
 * /discover when nothing was recorded.
 */
export function GoBack() {
  const router = useRouter();
  const href = useBackTarget();

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
