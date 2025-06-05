'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export function GoBack() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 p-0 text-zinc-400 transition-colors hover:text-white"
      variant="link-white"
    >
      <ChevronLeft className="h-4 w-4" />
      Go back to previous page
    </Button>
  );
}
