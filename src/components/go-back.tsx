'use client';

import { ChevronLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { getBackTarget } from '@/lib/back-target';

import { Button } from './ui/button';

/**
 * Deterministic back button for detail pages. Navigates to the URL recorded
 * when the user clicked into this page (search with its query, discover with
 * its filters, another detail page) instead of relying on the `referer` header
 * or browser history — both of which break after login redirects or repeated
 * searches. Falls back to /discover when nothing was recorded.
 */
export function GoBack() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Button
      onClick={() => {
        router.push(getBackTarget(pathname) ?? '/discover');
      }}
      className="inline-flex items-center gap-2 p-0 text-zinc-400 transition-colors hover:text-white"
      variant="link"
    >
      <ChevronLeft className="h-4 w-4" />
      Go back to previous page
    </Button>
  );
}
