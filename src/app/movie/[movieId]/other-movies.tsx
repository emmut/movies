import ResourceCard from '@/components/resource-card';
import { ItemSlider } from '@/components/ui/item-slider';
import { Skeleton } from '@/components/ui/skeleton';
import { getMovieRecommendations, getMovieSimilar } from '@/lib/movies';
import { Suspense } from 'react';

type MovieRecommendationsProps = {
  movieId: number;
};

async function SimilarMovies({ movieId }: MovieRecommendationsProps) {
  const similar = await getMovieSimilar(movieId);

  if (similar.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="mt-8 mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
          Similar Movies
        </h2>
        <p className="text-muted-foreground hidden text-sm sm:block">
          You might also like
        </p>
      </div>

      <ItemSlider>
        {similar.map((movie) => (
          <ResourceCard
            key={movie.id}
            resource={movie}
            type="movie"
            className="w-48"
          />
        ))}
      </ItemSlider>
    </div>
  );
}

async function RecommendationsMovie({ movieId }: MovieRecommendationsProps) {
  const recommendations = await getMovieRecommendations(movieId);

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
        {recommendations.map((movie) => (
          <ResourceCard
            key={movie.id}
            resource={movie}
            type="movie"
            className="w-48"
          />
        ))}
      </ItemSlider>
    </div>
  );
}

function OtherMoviesSkeleton() {
  return (
    <>
      <div className="flex items-end justify-between">
        <Skeleton className="mt-8 mb-4 h-10 w-48" />
        <Skeleton className="mt-8 mb-4 h-8 w-40" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <ResourceCard.Skeleton key={index} className="w-48" />
        ))}
      </div>
    </>
  );
}

export async function OtherMovies({ movieId }: MovieRecommendationsProps) {
  return (
    <div className="flex flex-col">
      <Suspense fallback={<OtherMoviesSkeleton />}>
        <SimilarMovies movieId={movieId} />
      </Suspense>

      <Suspense fallback={<OtherMoviesSkeleton />}>
        <RecommendationsMovie movieId={movieId} />
      </Suspense>
    </div>
  );
}
