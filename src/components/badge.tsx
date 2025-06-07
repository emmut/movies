import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { ReactNode } from 'react';

const badgeVariants = cva(
  'rounded-full border px-2 py-1 text-xs font-medium transition-all',
  {
    variants: {
      variant: {
        yellow: 'bg-yellow-500/95 text-yellow-950 border-yellow-600/70',
        red: 'bg-red-500/95 text-red-950 border-red-600/70',
      },
    },
    defaultVariants: {
      variant: 'yellow',
    },
  }
);

type BadgeProps = {
  children: ReactNode;
  className?: string;
} & VariantProps<typeof badgeVariants>;

export default function Badge({ children, variant, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}
