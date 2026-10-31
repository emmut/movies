import type { ReactNode } from 'react';

/** Shared by live list filters and their loading placeholders. */
export function ListToolbarRow({ children }: { children: ReactNode }) {
  return (
    <div data-slot="list-toolbar-controls" className="flex flex-wrap items-center gap-3">
      {children}
    </div>
  );
}
