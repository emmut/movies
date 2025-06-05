import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { HTMLAttributes, ReactNode } from 'react';

const pillVariants = cva(
  'flex h-7 shrink-0 items-center justify-center rounded-full px-4 text-center text-sm font-medium whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        default:
          'text-muted-foreground bg-muted/60 hover:text-foreground data-[active=true]:bg-muted data-[active=true]:text-neutral-100 data-[active=true]:ring',
        ghost:
          'text-muted-foreground hover:text-foreground hover:bg-accent data-[active=true]:text-foreground data-[active=true]:bg-accent',
        skeleton: 'animate-pulse bg-neutral-50/10 text-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type PillProps = {
  active?: boolean;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof pillVariants>;

export default function Pill({
  active = false,
  variant,
  className,
  children,
  ...rest
}: PillProps) {
  return (
    <div
      className={cn(pillVariants({ variant, className }))}
      {...rest}
      data-active={active}
    >
      {children}
    </div>
  );
}
