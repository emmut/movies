import { useSidebar } from '@movies/ui/components/sidebar';
import { cn } from 'cn';
import { Popcorn } from 'lucide-react';
import Link from 'next/link';
type BrandProps = {
  className?: string;
};
export default function Brand({ className }: BrandProps) {
  const { setOpenMobile } = useSidebar();

  return (
    <Link
      href="/"
      className={cn('flex min-h-11 items-center gap-2 px-2 py-1', className)}
      onClick={() => setOpenMobile(false)}
    >
      <Popcorn className="size-8 shrink-0" aria-hidden="true" />
      <span className="pt-0.5 font-light">Movies</span>
    </Link>
  );
}
