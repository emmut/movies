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

/**
 * Renders a styled badge element with customizable color variants.
 *
 * @param children - The content to display inside the badge.
 * @param variant - The color variant of the badge. Defaults to "yellow" if not specified.
 * @param className - Additional CSS classes to apply to the badge.
 *
 * @returns A <span> element styled as a badge containing the provided {@link children}.
 */
export default function Badge({ children, variant, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}
