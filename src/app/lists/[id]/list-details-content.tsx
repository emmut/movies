'use client';

import { DeleteListButton } from '@/components/delete-list-button';
import { EditListDialog } from '@/components/edit-list-dialog';
import { PaginationControls } from '@/components/pagination-controls';
import SectionTitle from '@/components/section-title';
import { parseAsInteger, useQueryStates } from 'nuqs';
import { ReactNode } from 'react';

type ListDetailsContentProps = {
  listId: string;
  listName: string;
  listDescription: string | null;
  listEmoji: string;
  listItemCount: number;
  totalPages: number;
  createdAt: string;
  grid: ReactNode;
  userId?: string;
};

/**
 * Client component that handles the list details page content.
 * Uses nuqs to manage URL state for pagination.
 */
export function ListDetailsContent({
  listId,
  listName,
  listDescription,
  listEmoji,
  listItemCount,
  totalPages,
  createdAt,
  grid,
}: ListDetailsContentProps) {
  // Use nuqs to manage URL state for page (triggers server re-render via URL navigation)
  useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
    },
    {
      history: 'push',
    },
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>{listName}</SectionTitle>
          <div className="flex items-center gap-2">
            <EditListDialog
              listId={listId}
              listName={listName}
              listDescription={listDescription}
              listEmoji={listEmoji}
            />
            <DeleteListButton
              listId={listId}
              listName={listName}
              itemCount={listItemCount}
              redirectAfterDelete={true}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-zinc-400">
              {listItemCount} item{listItemCount !== 1 ? 's' : ''} in this list
            </p>
            <span className="text-zinc-500">• Created {createdAt}</span>
          </div>
        </div>

        {listDescription && <p className="mt-4 text-zinc-300">{listDescription}</p>}
      </div>

      {grid}

      {listItemCount > 0 && totalPages > 1 && (
        <PaginationControls totalPages={totalPages} pageType="lists" />
      )}
    </div>
  );
}
