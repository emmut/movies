import MovieCard from './MovieCard';
import type { Movie } from '@/types/Movie';

type MoviesProps = {
  movies: Movie[];
};

export async function Movies({ movies }: MoviesProps) {
  return (
    <>
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
      {movies.length === 0 && (
        <p className="col-span-full text-center">No movies was found</p>
      )}
    </>
  );
}

Movies.Ghosts = function Ghosts() {
  return (
    <>
      {[...Array(20)].map((_, i) => (
        <MovieCard.Ghost key={i} />
      ))}
    </>
  );
};

export default Movies;
