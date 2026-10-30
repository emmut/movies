import { X } from 'lucide-react';

import Pill from '@/components/pill';

export function DiscoverKeywords({
  keywords,
  onRemove,
}: {
  keywords: { id: number; name: string }[];
  onRemove: (id: number) => void;
}) {
  if (keywords.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Selected keywords">
      <span className="mr-1 text-sm text-muted-foreground">Themes &amp; Keywords</span>
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
  );
}
