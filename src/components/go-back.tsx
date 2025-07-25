'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

type GoBackProps = {
  referer: string | null;
};

export function GoBack({ referer }: GoBackProps) {
  const router = useRouter();
  const [useDynamicBackButton, setUseDynamicBackButton] = useState(false);

  useEffect(() => {
    if (referer?.includes(window.location.origin)) {
      setUseDynamicBackButton(true);
    }
  }, [referer]);

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
