import SectionTitle from '@/components/section-title';
import { getUser } from '@/lib/auth-server';
import { getListDetails } from '@/lib/lists';
import { redirect } from 'next/navigation';

export default async function ListDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const list = await getListDetails(params.id);

  return (
    <div className="p-4">
      <SectionTitle>{list.name}</SectionTitle>
      {list.description && (
        <p className="mt-2 text-gray-400">{list.description}</p>
      )}
      <p className="mt-2 text-sm text-gray-500">
        {list.itemCount} items • Created {list.createdAt.toLocaleDateString()}
      </p>

      {list.itemCount > 0 ? (
        <div className="mt-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {list.items?.map((item) => (
              <div
                key={`${item.resourceType}-${item.resourceId}`}
                className="rounded-lg bg-gray-800 p-4 text-center"
              >
                <div className="mb-2 text-2xl">
                  {item.resourceType === 'movie' ? '🎬' : '📺'}
                </div>
                <p className="text-sm text-gray-300">
                  {item.resourceType === 'movie' ? 'Movie' : 'TV Show'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  ID: {item.resourceId}
                </p>
                <p className="text-xs text-gray-500">
                  Added {item.createdAt.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 text-6xl">📝</div>
          <h3 className="mb-2 text-lg font-semibold">This list is empty</h3>
          <p className="text-gray-400">
            Add movies or TV shows by clicking the list button on any content
          </p>
        </div>
      )}
    </div>
  );
}
