import { Button } from '@movies/ui/components/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@movies/ui/components/popover';
import { cn } from 'cn';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { FilterCount } from '@/components/filter-count';
import { useResponsivePopover } from '@/hooks/use-responsive-popover';

export function DiscoverFilterPopover({
  count,
  label,
  title,
  description,
  icon: Icon,
  children,
}: {
  count: number;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  const { open, setOpen, triggerRef } = useResponsivePopover();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={triggerRef}
        render={<Button variant="outline" />}
        aria-label={count > 0 ? `${label} (${count})` : label}
        className={cn('relative h-10 gap-2 px-4', count > 0 && 'border-primary/40 bg-primary/5')}
      >
        <Icon className="size-4" aria-hidden="true" />
        {label}
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <FilterCount count={count} />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={12}
        className="w-80 max-w-(--available-width) gap-4 p-4"
      >
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
          <PopoverDescription>{description}</PopoverDescription>
        </PopoverHeader>
        {children}
      </PopoverContent>
    </Popover>
  );
}
