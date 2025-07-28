import { ItemCard } from '@/components/item-card';
import { ItemSlider } from '@/components/ui/item-slider';
import { getMovieRecommendations, getMovieSimilar } from '@/lib/movies';
import { Suspense } from 'react';

type MovieRecommendationsProps = {
  movieId: number;
};

async function SimilarMovies({ movieId }: MovieRecommendationsProps) {
  const similar = await getMovieSimilar(movieId);

  if (similar.results.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Similar</h2>
        <p>No similar movies found</p>
      </div>
    );
  }

  return similar.results.map((movie) => (
    <ItemCard key={movie.id} resource={movie} type="movie" />
  ));
}

async function Recommendations({ movieId }: MovieRecommendationsProps) {
  const recommendations = await getMovieRecommendations(movieId);

  if (recommendations.results.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Recommendations</h2>
        <p>No recommendations found</p>
      </div>
    );
  }

  return recommendations.results.map((movie) => (
    <ItemCard key={movie.id} resource={movie} type="movie" />
  ));
}

export async function OtherMovies({ movieId }: MovieRecommendationsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Other Movies</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ItemSlider>
          <Suspense fallback={<div>Loading...</div>}>
            <SimilarMovies movieId={movieId} />
          </Suspense>
        </ItemSlider>

        <ItemSlider>
          <Suspense fallback={<div>Loading...</div>}>
            <Recommendations movieId={movieId} />
          </Suspense>
        </ItemSlider>
      </div>
    </div>
  );
}
