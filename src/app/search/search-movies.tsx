import ResourceCard from '@/components/resource-card';
import { fetchMoviesBySearchQuery } from '@/lib/search';

type SearchMoviesProps = {
  searchQuery: string;
  currentPage: string;
};

/**
 * Asynchronously fetches and displays a list of movies matching the given search query and page.
 *
 * Renders a {@link ResourceCard} for each movie in the search results.
 *
 * @param searchQuery - The search term to filter movies.
 * @param currentPage - The page number of results to retrieve.
 * @returns An array of {@link ResourceCard} components representing the movies.
 */
export default async function SearchMovies({
  searchQuery,
  currentPage,
}: SearchMoviesProps) {
  const { movies } = await fetchMoviesBySearchQuery(searchQuery, currentPage);

  return movies.map((movie) => (
    <ResourceCard key={movie.id} resource={movie} type="movie" />
  ));
}
