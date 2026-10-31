import type { ReactNode } from 'react';

/** Shared by live list controls and their loading placeholders. */
export function ListToolbarRow({ filters, actions }: { filters: ReactNode; actions: ReactNode }) {
  return (
    <div data-slot="list-toolbar-controls" className="flex flex-wrap items-center gap-4">
      {filters}
      <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}
