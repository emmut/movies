import ResourceCard from '@/components/resource-card';
import { fetchMoviesBySearchQuery } from '@/lib/search';

type SearchMoviesProps = {
  searchQuery: string;
  currentPage: string;
};

export default async function SearchMovies({
  searchQuery,
  currentPage,
}: SearchMoviesProps) {
  const { movies } = await fetchMoviesBySearchQuery(searchQuery, currentPage);

  return movies.map((movie) => (
    <ResourceCard key={movie.id} resource={movie} type="movie" />
  ));
}
