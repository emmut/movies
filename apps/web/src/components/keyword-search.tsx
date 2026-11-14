import { Tag } from 'lucide-react';

import { NamedFilterSearch } from '@/components/named-filter-search';

export function KeywordSearch(props: { selectedIds: number[]; onSelect: (id: number) => void }) {
  return <NamedFilterSearch {...props} kind="keyword" label="tags" icon={Tag} />;
}
