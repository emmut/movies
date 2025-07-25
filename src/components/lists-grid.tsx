import type { LocalList } from '@/lib/lists';
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
        <Link
          key={list.id}
          href={`/lists/${list.id}`}
          className="hover:ring-primary relative block overflow-hidden rounded-lg bg-gray-800 p-6 transition-all hover:ring-2"
        >
          <div className="flex h-full flex-col">
            <div className="flex-1">
              <div className="mb-4 text-4xl">📝</div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {list.name}
              </h3>
              {list.description && (
                <p className="mb-4 line-clamp-2 text-sm text-gray-300">
                  {list.description}
                </p>
              )}
            </div>
            <div className="border-t border-gray-700 pt-4">
              <p className="text-sm text-gray-400">{list.itemCount} items</p>
              <p className="text-xs text-gray-500">
                Updated {list.updatedAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
