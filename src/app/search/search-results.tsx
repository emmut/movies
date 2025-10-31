'use client';

import ItemCard from '@/components/item-card';
import ItemGrid from '@/components/item-grid';
import PersonCard from '@/components/person-card';
import SearchBox from '@/components/search-box';
import { useSearchQuery } from '@/hooks/use-search-query';
import {
  isSearchMoviesResult,
  isSearchMultiResult,
  isSearchPersonsResult,
  isSearchTvShowsResult,
} from '@/lib/search';
import { MediaType } from '@/types/media-type';

type SearchResultsProps = {
  searchQuery: string;
  currentPage: number;
  mediaType: MediaType;
  userId?: string;
};

/**
 * Fetches and displays search results for movies, TV shows, persons, or mixed results based on the media type.
 *
 * Renders ResourceCard components for movies/TV shows and PersonCard components for persons in the search results.
 *
 * @param searchQuery - The search term to filter content.
 * @param currentPage - The page number of results to retrieve.
 * @param mediaType - Whether to search for 'movie', 'tv', 'person', or 'all' content.
 * @param userId - Optional user ID to enable list functionality.
 * @returns An array of components representing the search results.
 */
export default function SearchResults({
  searchQuery,
  currentPage,
  mediaType,
  userId,
}: SearchResultsProps) {
  const { data, isLoading, error } = useSearchQuery({
    query: searchQuery,
    page: currentPage,
    mediaType,
  });

  if (!searchQuery) {
    return <SearchBox mediaType={mediaType} autoFocus />;
  }

  if (isLoading) {
    return <ItemGrid.Skeletons className="w-full" />;
  }

  if (error) {
    return (
      <div className="col-span-full text-center text-red-500">
        Error loading search results. Please try again.
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (mediaType === 'tv' && isSearchTvShowsResult(data)) {
    const { tvShows } = data;

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

  if (mediaType === 'person' && isSearchPersonsResult(data)) {
    const { persons } = data;

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

  if (mediaType === 'movie' && isSearchMoviesResult(data)) {
    const { movies } = data;

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
  if (isSearchMultiResult(data)) {
    const { results } = data;

    return (
      <>
        {results.map((result) => {
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

  return null;
}
