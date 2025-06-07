import { fetchDiscoverMovies } from '@/lib/movies';
import ResourceCard from './resource-card';

type MoviesProps = {
  currentGenreId: number;
  currentPage: number;
};

/**
 * Displays a list of movies for the specified genre and page.
 *
 * Fetches movies based on the given genre and page, rendering a {@link ResourceCard} for each movie. If no movies are found, displays a message indicating that no movies were found.
 *
 * @param currentGenreId - The ID of the genre to filter movies by.
 * @param currentPage - The page number of results to display.
 */
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

/**
 * Renders a set of 20 skeleton placeholders for movie resource cards.
 *
 * Typically used to indicate loading state while movie data is being fetched.
 */
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
