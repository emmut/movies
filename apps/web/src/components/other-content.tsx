'use client';

import { useQuery } from '@tanstack/react-query';

import ItemCard from '@/components/item-card';
import { ItemSlider } from '@movies/ui/components/item-slider';
import { Skeleton } from '@movies/ui/components/skeleton';
import { orpc } from '@/utils/orpc';

type OtherContentProps = {
  id: number;
  type: 'movie' | 'tv';
};

function SectionSkeleton({ title }: { title: string }) {
  return (
    <div className="flex flex-col">
      <div className="mt-8 mb-2 flex items-end justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ItemCard.Skeleton key={i} className="w-48" />
        ))}
      </div>
    </div>
  );
}

export function OtherContent({ id, type }: OtherContentProps) {
  const similar = useQuery(
    type === 'movie'
      ? orpc.movies.similar.queryOptions({ input: { movieId: id } })
      : orpc.tv.similar.queryOptions({ input: { tvId: id } }),
  );

  const recommendations = useQuery(
    type === 'movie'
      ? orpc.movies.recommendations.queryOptions({ input: { movieId: id } })
      : orpc.tv.recommendations.queryOptions({ input: { tvId: id } }),
  );

  const similarTitle = type === 'movie' ? 'Similar Movies' : 'Similar TV Shows';

  return (
    <div className="flex flex-col">
      {similar.isLoading ? (
        <SectionSkeleton title={similarTitle} />
      ) : (similar.data?.length ?? 0) > 0 ? (
        <div className="flex flex-col">
          <div className="mt-8 mb-2 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">{similarTitle}</h2>
            <p className="hidden text-sm text-muted-foreground sm:block">You might also like</p>
          </div>
          <ItemSlider>
            {similar.data!.map((item) => (
              <ItemCard key={item.id} resource={item} type={type} className="w-48" />
            ))}
          </ItemSlider>
        </div>
      ) : null}

      {recommendations.isLoading ? (
        <SectionSkeleton title="Recommendations" />
      ) : (recommendations.data?.length ?? 0) > 0 ? (
        <div className="flex flex-col">
          <div className="mt-8 mb-2 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">Recommendations</h2>
            <p className="hidden text-sm text-muted-foreground sm:block">You might also like</p>
          </div>
          <ItemSlider>
            {recommendations.data!.map((item) => (
              <ItemCard key={item.id} resource={item} type={type} className="w-48" />
            ))}
          </ItemSlider>
        </div>
      ) : null}
    </div>
  );
}
