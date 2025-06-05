import { HTMLAttributes, ReactNode } from 'react';

type PillProps = {
  active?: boolean;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export default function Pill({ active = false, children, ...rest }: PillProps) {
  return (
    <div
      className="text-muted-foreground bg-muted/60 hover:text-foreground data-[active=true]:bg-muted flex h-7 shrink-0 items-center justify-center rounded-full px-4 text-center text-sm font-medium whitespace-nowrap transition-colors data-[active=true]:text-neutral-100 data-[active=true]:ring"
      {...rest}
      data-active={active}
    >
      {children}
    </div>
  );
}
