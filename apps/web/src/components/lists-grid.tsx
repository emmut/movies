import { Edit, Trash2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { DeleteListButton } from '@/components/delete-list-button';
import { EditListDialog } from '@/components/edit-list-dialog';
import { Button } from '@movies/ui/components/button';
import { LocalList } from '@movies/api/lib/lists';

interface ListsGridProps {
  lists: LocalList[];
}

export function ListsGrid({ lists }: ListsGridProps) {
  if (lists.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-6xl opacity-50">📝</div>
        <h2 className="mb-2 text-xl font-semibold">No lists yet</h2>
        <p className="text-zinc-400">
          Create your first list to organize your movies, TV shows, and people
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {lists.map((list) => (
        <div
          key={list.id}
          className="group/list relative rounded-lg focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2 focus-within:ring-offset-black"
        >
          <Link
            href={`/lists/${list.id}`}
            className="relative block min-h-[200px] overflow-hidden rounded-lg border border-muted bg-muted/60 p-6 transition-all hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black focus:outline-none"
          >
            <div className="flex h-full flex-col">
              <div className="flex-1">
                <div className="mb-4 text-4xl">{list.emoji}</div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{list.name}</h3>
                <div className="min-h-[40px]">
                  {list.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{list.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-muted pt-4">
                <p className="text-sm text-muted-foreground">{list.itemCount} items</p>
                <p className="text-xs text-muted-foreground">
                  Updated {list.updatedAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          </Link>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200 group-focus-within/list:opacity-100 group-hover/list:opacity-100">
            <EditListDialog
              listId={list.id}
              listName={list.name}
              listDescription={list.description}
              listEmoji={list.emoji}
            >
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
            </EditListDialog>
            <DeleteListButton
              listId={list.id}
              listName={list.name}
              itemCount={list.itemCount}
              redirectAfterDelete={false}
            >
              <Button variant="destructive" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DeleteListButton>
          </div>
        </div>
      ))}
    </div>
  );
}
