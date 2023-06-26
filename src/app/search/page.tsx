import MovieCard from '@/components/MovieCard';
import SectionTitle from '@/components/SectionTitle';
import { SearchedMovieResponse } from '@/types/Movie';
import { env } from 'process';

type SearchProps = {
  searchParams: {
    q?: string;
  };
};

async function fetchMoviesBySearchQuery(query: string) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/collection?query=${query}&sort_by=popularity.desc&include_adult=false&include_video=false`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        cache: 'no-store',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed fetching searched movies');
  }

  const movies: SearchedMovieResponse = await res.json();
  return movies.results;
}

export default async function SearchPage({ searchParams }: SearchProps) {
  const query = searchParams.q ?? '';
  const movies = await fetchMoviesBySearchQuery(query);

  return (
    <div className="">
      <SectionTitle>Search</SectionTitle>

      <div className="mt-8 grid max-w-screen-lg grid-cols-5 gap-4">
        {movies.map((movie) => (
          <MovieCard.Searched key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
