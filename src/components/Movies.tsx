import { fetchDiscoverMovies } from '@/lib/discover';
import MovieCard from './movie-card';

type MoviesProps = {
  currentGenreId: number;
  currentPage: number;
};

export async function Movies({ currentGenreId, currentPage }: MoviesProps) {
  const { movies } = await fetchDiscoverMovies(currentGenreId, currentPage);

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
