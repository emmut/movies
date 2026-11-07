import { KeywordSearch } from '@/components/keyword-search';
import { SelectedFilterChips } from '@/components/selected-filter-chips';
import type { Keyword } from '@/types/keyword';

export function DiscoverKeywords({
  keywords,
  onAdd,
  onRemove,
}: {
  keywords: Keyword[];
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <section className="space-y-3" aria-label="Themes & Keywords">
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Themes &amp; Keywords</h2>
        <KeywordSearch selectedIds={keywords.map((keyword) => keyword.id)} onSelect={onAdd} />
      </div>
      <SelectedFilterChips items={keywords} kind="keyword" onRemove={onRemove} />
    </section>
  );
}
