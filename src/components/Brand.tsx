import clsx from 'clsx';
import Link from 'next/link';
import { Popcorn } from 'lucide-react';
import { cn } from '@/lib/utils';
type BrandProps = {
  className?: string;
};
export default function Brand({ className }: BrandProps) {
  return (
    <Link
      href="/"
      className={cn('flex items-center gap-2 px-2 py-1', className)}
    >
      <Popcorn className="h-6 w-6" />
      <span className="pt-0.5 font-light">Movies</span>
    </Link>
  );
}
