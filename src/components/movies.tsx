import { fetchDiscoverMovies } from '@/lib/movies';
import ResourceCard from './resource-card';

type MoviesProps = {
  currentGenreId: number;
  currentPage: number;
};

export async function Movies({ currentGenreId, currentPage }: MoviesProps) {
  const { movies } = await fetchDiscoverMovies(currentGenreId, currentPage);

  return (
    <>
      {movies.map((movie) => (
        <ResourceCard key={movie.id} resource={movie} type="movie" />
      ))}
      {movies.length === 0 && (
        <p className="col-span-full text-center">No movies was found</p>
      )}
    </>
  );
}

function MoviesSkeletons() {
  return (
    <>
      {Array.from({ length: 20 }).map((_, index) => (
        <ResourceCard.Skeleton key={index} />
      ))}
    </>
  );
}

Movies.Skeletons = MoviesSkeletons;

export default Movies;
