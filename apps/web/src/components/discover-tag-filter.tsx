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
import { ChevronDown, Tag } from 'lucide-react';

import { FilterCount } from '@/components/filter-count';
import { KeywordSearch } from '@/components/keyword-search';
import { useResponsivePopover } from '@/hooks/use-responsive-popover';

export function DiscoverTagFilter({
  selectedIds,
  onSelect,
}: {
  selectedIds: number[];
  onSelect: (id: number) => void;
}) {
  const { open, setOpen, triggerRef } = useResponsivePopover();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={triggerRef}
        render={<Button variant="outline" />}
        aria-label={selectedIds.length > 0 ? `Tags (${selectedIds.length})` : 'Tags'}
        className={cn(
          'relative h-10 gap-2 px-4',
          selectedIds.length > 0 && 'border-primary/40 bg-primary/5',
        )}
      >
        <Tag className="size-4" aria-hidden="true" />
        Tags
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <FilterCount count={selectedIds.length} />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={12}
        className="w-80 max-w-(--available-width) gap-4 p-4"
      >
        <PopoverHeader>
          <PopoverTitle>Themes &amp; Keywords</PopoverTitle>
          <PopoverDescription>Find titles by a theme, setting or subject.</PopoverDescription>
        </PopoverHeader>
        <KeywordSearch selectedIds={selectedIds} onSelect={onSelect} />
      </PopoverContent>
    </Popover>
  );
}
