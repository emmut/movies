import { X } from 'lucide-react';

import { KeywordSearch } from '@/components/keyword-search';
import Pill from '@/components/pill';
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
    <section className="mt-5 space-y-3" aria-label="Themes & Keywords">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Themes &amp; Keywords</h2>
        <KeywordSearch selectedIds={keywords.map((keyword) => keyword.id)} onSelect={onAdd} />
      </div>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Selected keywords">
          {keywords.map((keyword) => (
            <button
              key={keyword.id}
              type="button"
              onClick={() => onRemove(keyword.id)}
              aria-label={`Remove keyword ${keyword.name}`}
              className="max-w-full rounded-full focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Pill active className="h-auto min-h-7 gap-2 py-1 whitespace-normal">
                <span className="wrap-anywhere">{keyword.name}</span>
                <X className="size-3.5 shrink-0" aria-hidden="true" />
              </Pill>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
