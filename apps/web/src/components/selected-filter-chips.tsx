import { X } from 'lucide-react';

import Pill from '@/components/pill';

export function SelectedFilterChips({
  items,
  kind,
  onRemove,
}: {
  items: { id: number; name: string }[];
  kind: 'genre' | 'keyword';
  onRemove: (id: number) => void;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2" aria-label={`Selected ${kind}s`}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${kind} ${item.name}`}
          className="max-w-full rounded-full focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <Pill active className="h-auto min-h-7 gap-2 py-1 whitespace-normal">
            <span className="wrap-anywhere">{item.name}</span>
            <X className="size-3.5 shrink-0" aria-hidden="true" />
          </Pill>
        </button>
      ))}
    </div>
  );
}
