import { DeleteListButton } from '@/components/delete-list-button';
import { Button } from '@/components/ui/button';
import type { LocalList } from '@/lib/lists';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ListsGridProps {
  lists: LocalList[];
}

export function ListsGrid({ lists }: ListsGridProps) {
  if (lists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-6xl">📝</div>
        <h3 className="mb-2 text-lg font-semibold">No lists yet</h3>
        <p className="text-gray-400">
          Create your first list by clicking the list button on any movie or TV
          show
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {lists.map((list) => (
        <div key={list.id} className="group relative">
          <Link
            href={`/lists/${list.id}`}
            className="relative block overflow-hidden rounded-lg border border-blue-700/50 bg-blue-900/30 p-6 transition-all hover:border-blue-400 hover:ring-2 hover:ring-blue-400"
          >
            <div className="flex h-full flex-col">
              <div className="flex-1">
                <div className="mb-4 text-4xl transition-transform group-hover:scale-110">
                  📝
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {list.name}
                </h3>
                {list.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-blue-200">
                    {list.description}
                  </p>
                )}
              </div>
              <div className="border-t border-blue-700/50 pt-4">
                <p className="text-sm text-blue-300">{list.itemCount} items</p>
                <p className="text-xs text-blue-400">
                  Updated {list.updatedAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          </Link>

          <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
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
