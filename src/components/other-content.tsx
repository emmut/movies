import ItemCard from '@/components/item-card';
import { ItemSlider } from '@/components/ui/item-slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Movie } from '@/types/movie';
import { TvShow } from '@/types/tv-show';
import { Suspense } from 'react';

type OtherContentProps = {
  id: number;
  type: 'movie' | 'tv';
  getSimilar: (id: number) => Promise<(Movie | TvShow)[]>;
  getRecommendations: (id: number) => Promise<(Movie | TvShow)[]>;
};

async function SimilarContent({
  id,
  type,
  getSimilar,
}: Pick<OtherContentProps, 'id' | 'type' | 'getSimilar'>) {
  const similar = await getSimilar(id);

  if (similar.length === 0) {
    return null;
  }

  const titleText = type === 'movie' ? 'Similar Movies' : 'Similar TV Shows';

  return (
    <div className="flex flex-col">
      <div className="mt-8 mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
          {titleText}
        </h2>
        <p className="text-muted-foreground hidden text-sm sm:block">
          You might also like
        </p>
      </div>

      <ItemSlider>
        {similar.map((item) => (
          <ItemCard
            key={item.id}
            resource={item}
            type={type}
            className="w-48"
          />
        ))}
      </ItemSlider>
    </div>
  );
}

async function RecommendationsContent({
  id,
  type,
  getRecommendations,
}: Pick<OtherContentProps, 'id' | 'type' | 'getRecommendations'>) {
  const recommendations = await getRecommendations(id);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="mt-8 mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
          Recommendations
        </h2>
        <p className="text-muted-foreground hidden text-sm sm:block">
          You might also like
        </p>
      </div>

      <ItemSlider>
        {recommendations.map((item) => (
          <ItemCard
            key={item.id}
            resource={item}
            type={type}
            className="w-48"
          />
        ))}
      </ItemSlider>
    </div>
  );
}

function OtherContentSkeleton() {
  return (
    <>
      <div className="flex items-end justify-between">
        <Skeleton className="mt-8 mb-4 h-10 w-48" />
        <Skeleton className="mt-8 mb-4 h-8 w-40" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <ItemCard.Skeleton key={index} className="w-48" />
        ))}
      </div>
    </>
  );
}

export function OtherContent({
  id,
  type,
  getSimilar,
  getRecommendations,
}: OtherContentProps) {
  return (
    <div className="flex flex-col">
      <Suspense fallback={<OtherContentSkeleton />}>
        <SimilarContent id={id} type={type} getSimilar={getSimilar} />
      </Suspense>

      <Suspense fallback={<OtherContentSkeleton />}>
        <RecommendationsContent
          id={id}
          type={type}
          getRecommendations={getRecommendations}
        />
      </Suspense>
    </div>
  );
}
