import type { ReactNode } from 'react';

/** Keeps page actions beside the title, separate from filtering controls. */
export function ListHeaderRow({ title, actions }: { title: ReactNode; actions: ReactNode }) {
  return (
    <div data-slot="list-header-row" className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1 basis-48 break-words">{title}</div>
      <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>
    </div>
  );
}
