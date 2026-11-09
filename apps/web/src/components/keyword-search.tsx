import { Tag } from 'lucide-react';

import { NamedFilterSearch } from '@/components/named-filter-search';
import { searchKeywords } from '@/lib/keyword-search';
import { queryKeys } from '@/lib/query-keys';

export function KeywordSearch(props: { selectedIds: number[]; onSelect: (id: number) => void }) {
  return (
    <NamedFilterSearch
      {...props}
      search={searchKeywords}
      queryKey={queryKeys.search.keywords}
      label="tags"
      icon={Tag}
    />
  );
}
