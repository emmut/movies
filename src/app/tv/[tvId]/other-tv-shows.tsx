import ResourceCard from '@/components/resource-card';
import { ItemSlider } from '@/components/ui/item-slider';
import { getTvShowRecommendations, getTvShowSimilar } from '@/lib/tv-shows';
import { Suspense } from 'react';

type TvRecommendationsProps = {
  tvId: number;
};

async function SimilarTvShows({ tvId }: TvRecommendationsProps) {
  const similar = await getTvShowSimilar(tvId);

  if (similar.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="mt-8 mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
          Similar TV Shows
        </h2>
        <p className="text-muted-foreground hidden text-sm sm:block">
          You might also like
        </p>
      </div>

      <ItemSlider>
        {similar.map((tvShow) => (
          <ResourceCard
            key={tvShow.id}
            resource={tvShow}
            type="tv"
            className="w-48"
          />
        ))}
      </ItemSlider>
    </div>
  );
}

async function Recommendations({ tvId }: TvRecommendationsProps) {
  const recommendations = await getTvShowRecommendations(tvId);

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
        {recommendations.map((tvShow) => (
          <ResourceCard
            key={tvShow.id}
            resource={tvShow}
            type="tv"
            className="w-48"
          />
        ))}
      </ItemSlider>
    </div>
  );
}

export async function OtherTvShows({ tvId }: TvRecommendationsProps) {
  return (
    <div className="flex flex-col">
      <Suspense fallback={<ResourceCard.Skeleton />}>
        <SimilarTvShows tvId={tvId} />
      </Suspense>

      <Suspense fallback={<ResourceCard.Skeleton />}>
        <Recommendations tvId={tvId} />
      </Suspense>
    </div>
  );
}
