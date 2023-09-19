import MovieCard from '@/components/MovieCard';
import { fetchMoviesBySearchQuery } from '@/lib/search';

type SearchMoviesProps = {
  currentQuery: string;
  currentPage: string;
};

export default async function SearchMovies({
  currentQuery,
  currentPage,
}: SearchMoviesProps) {
  const movies = await fetchMoviesBySearchQuery(currentQuery, currentPage);

  return movies.results.map((movie) => (
    <MovieCard key={movie.id} movie={movie} />
  ));
}
