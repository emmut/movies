import ActorCard from '@/components/actor-card';
import ResourceCard from '@/components/resource-card';
import {
  fetchActorsBySearchQuery,
  fetchMoviesBySearchQuery,
  fetchMultiSearchQuery,
  fetchTvShowsBySearchQuery,
} from '@/lib/search';
import { SearchedActor } from '@/types/actor';
import { Movie } from '@/types/movie';
import { TvShow } from '@/types/tv-show';

type MultiSearchResult =
  | (Movie & { media_type: 'movie' })
  | (TvShow & { media_type: 'tv' })
  | (SearchedActor & { media_type: 'person' });

type SearchResultsProps = {
  searchQuery: string;
  currentPage: string;
  mediaType: string;
};

/**
 * Asynchronously fetches and displays search results for movies, TV shows, actors, or mixed results based on the media type.
 *
 * Renders ResourceCard components for movies/TV shows and ActorCard components for actors in the search results.
 *
 * @param searchQuery - The search term to filter content.
 * @param currentPage - The page number of results to retrieve.
 * @param mediaType - Whether to search for 'movie', 'tv', 'actor', or 'all' content.
 * @returns An array of components representing the search results.
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

  if (mediaType === 'movie') {
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

  // 'all' - mixed results from multi search
  const { results } = await fetchMultiSearchQuery(searchQuery, currentPage);

  return (
    <>
      {results.map((result: MultiSearchResult) => {
        // Each result has a media_type property: 'movie', 'tv', or 'person'
        if (result.media_type === 'person') {
          return <ActorCard key={`person-${result.id}`} actor={result} />;
        } else if (result.media_type === 'tv') {
          return (
            <ResourceCard key={`tv-${result.id}`} resource={result} type="tv" />
          );
        } else if (result.media_type === 'movie') {
          return (
            <ResourceCard
              key={`movie-${result.id}`}
              resource={result}
              type="movie"
            />
          );
        }
        return null;
      })}
      {results.length === 0 && (
        <p className="col-span-full text-center text-zinc-400">
          No results found for &ldquo;{searchQuery}&rdquo;
        </p>
      )}
    </>
  );
}
