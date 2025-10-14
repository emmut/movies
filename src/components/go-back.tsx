'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

type GoBackProps = {
  referer: string | null;
};

export function GoBack({ referer }: GoBackProps) {
  const router = useRouter();
  const useDynamicBackButton =
    typeof window !== 'undefined'
      ? referer?.includes(window.location.origin)
      : false;

  return (
    <Button
      onClick={() => {
        if (useDynamicBackButton) {
          router.back();
        } else {
          router.push('/discover');
        }
      }}
      className="inline-flex items-center gap-2 p-0 text-zinc-400 transition-colors hover:text-white"
      variant="link"
    >
      <ChevronLeft className="h-4 w-4" />
      Go back to previous page
    </Button>
  );
}
