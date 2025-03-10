import MovieCard from '@/components/movie-card';
import { fetchMoviesBySearchQuery } from '@/lib/search';

type SearchMoviesProps = {
  currentQuery: string;
  currentPage: string;
};

export default async function SearchMovies({
  currentQuery,
  currentPage,
}: SearchMoviesProps) {
  const { movies } = await fetchMoviesBySearchQuery(currentQuery, currentPage);

  return movies.map((movie) => <MovieCard key={movie.id} movie={movie} />);
}
