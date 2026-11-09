import { Tag } from 'lucide-react';

import { DiscoverFilterPopover } from '@/components/discover-filter-popover';
import { KeywordSearch } from '@/components/keyword-search';

export function DiscoverTagFilter({
  selectedIds,
  onSelect,
}: {
  selectedIds: number[];
  onSelect: (id: number) => void;
}) {
  return (
    <DiscoverFilterPopover
      count={selectedIds.length}
      label="Tags"
      title="Themes & Keywords"
      description="Find titles by a theme, setting or subject."
      icon={Tag}
    >
      <KeywordSearch selectedIds={selectedIds} onSelect={onSelect} />
    </DiscoverFilterPopover>
  );
}
