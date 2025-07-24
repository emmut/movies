import ActorCard from '@/components/actor-card';
import ResourceCard from '@/components/resource-card';
import {
  fetchActorsBySearchQuery,
  fetchMoviesBySearchQuery,
  fetchTvShowsBySearchQuery,
} from '@/lib/search';

type SearchResultsProps = {
  searchQuery: string;
  currentPage: string;
  mediaType: string;
};

/**
 * Asynchronously fetches and displays search results for movies or TV shows based on the media type.
 *
 * Renders ResourceCard components for each result in the search results.
 *
 * @param searchQuery - The search term to filter content.
 * @param currentPage - The page number of results to retrieve.
 * @param mediaType - Whether to search for 'movie' or 'tv' content.
 * @returns An array of ResourceCard components representing the search results.
 */
export default async function SearchResults({
  searchQuery,
  currentPage,
  mediaType,
}: SearchResultsProps) {
  if (!searchQuery) {
    return (
      <p className="col-span-full text-center text-zinc-400">
        Enter a search term to find movies, TV shows, and actors
      </p>
    );
  }

  if (mediaType === 'tv') {
    const { tvShows } = await fetchTvShowsBySearchQuery(
      searchQuery,
      currentPage
    );

    return (
      <>
        {tvShows.map((tvShow) => (
          <ResourceCard key={tvShow.id} resource={tvShow} type="tv" />
        ))}
        {tvShows.length === 0 && (
          <p className="col-span-full text-center text-zinc-400">
            No TV shows found for &ldquo;{searchQuery}&rdquo;
          </p>
        )}
      </>
    );
  }

  if (mediaType === 'actor') {
    const { actors } = await fetchActorsBySearchQuery(searchQuery, currentPage);

    return (
      <>
        {actors.map((actor) => (
          <ActorCard key={actor.id} actor={actor} />
        ))}
        {actors.length === 0 && (
          <p className="col-span-full text-center text-zinc-400">
            No actors found for &ldquo;{searchQuery}&rdquo;
          </p>
        )}
      </>
    );
  }

  const { movies } = await fetchMoviesBySearchQuery(searchQuery, currentPage);

  return (
    <>
      {movies.map((movie) => (
        <ResourceCard key={movie.id} resource={movie} type="movie" />
      ))}
      {movies.length === 0 && (
        <p className="col-span-full text-center text-zinc-400">
          No movies found for &ldquo;{searchQuery}&rdquo;
        </p>
      )}
    </>
  );
}
