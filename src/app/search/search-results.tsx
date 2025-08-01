import ItemCard from '@/components/item-card';
import PersonCard from '@/components/person-card';
import SearchBox from '@/components/search-box';
import {
  fetchMoviesBySearchQuery,
  fetchMultiSearchQuery,
  fetchPersonsBySearchQuery,
  fetchTvShowsBySearchQuery,
} from '@/lib/search';
import { MediaType } from '@/types/media-type';
import { Movie } from '@/types/movie';
import { SearchedPerson } from '@/types/person';
import { TvShow } from '@/types/tv-show';

type MultiSearchResult =
  | (Movie & { media_type: 'movie' })
  | (TvShow & { media_type: 'tv' })
  | (SearchedPerson & { media_type: 'person' });

type SearchResultsProps = {
  searchQuery: string;
  currentPage: string;
  mediaType: MediaType;
  userId?: string;
};

/**
 * Asynchronously fetches and displays search results for movies, TV shows, persons, or mixed results based on the media type.
 *
 * Renders ResourceCard components for movies/TV shows and PersonCard components for persons in the search results.
 *
 * @param searchQuery - The search term to filter content.
 * @param currentPage - The page number of results to retrieve.
 * @param mediaType - Whether to search for 'movie', 'tv', 'person', or 'all' content.
 * @param userId - Optional user ID to enable list functionality.
 * @returns An array of components representing the search results.
 */
export default async function SearchResults({
  searchQuery,
  currentPage,
  mediaType,
  userId,
}: SearchResultsProps) {
  if (!searchQuery) {
    return <SearchBox mediaType={mediaType} autoFocus />;
  }

  if (mediaType === 'tv') {
    const { tvShows } = await fetchTvShowsBySearchQuery(
      searchQuery,
      currentPage
    );

    return (
      <>
        {tvShows.map((tvShow) => (
          <ItemCard
            key={tvShow.id}
            resource={tvShow}
            type="tv"
            userId={userId}
          />
        ))}
        {tvShows.length === 0 && (
          <p className="col-span-full text-center text-zinc-400">
            No TV shows found for &ldquo;{searchQuery}&rdquo;
          </p>
        )}
      </>
    );
  }

  if (mediaType === 'person') {
    const { persons } = await fetchPersonsBySearchQuery(
      searchQuery,
      currentPage
    );

    return (
      <>
        {persons.map((person) => (
          <PersonCard key={person.id} person={person} userId={userId} />
        ))}
        {persons.length === 0 && (
          <p className="col-span-full text-center text-zinc-400">
            No persons found for &ldquo;{searchQuery}&rdquo;
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
          <ItemCard
            key={movie.id}
            resource={movie}
            type="movie"
            userId={userId}
          />
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
          return (
            <PersonCard
              key={`person-${result.id}`}
              person={result}
              userId={userId}
            />
          );
        } else if (result.media_type === 'tv') {
          return (
            <ItemCard
              key={`tv-${result.id}`}
              resource={result}
              type="tv"
              userId={userId}
            />
          );
        } else if (result.media_type === 'movie') {
          return (
            <ItemCard
              key={`movie-${result.id}`}
              resource={result}
              type="movie"
              userId={userId}
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
