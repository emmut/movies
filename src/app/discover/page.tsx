import { env } from 'process';
import { GenreResponse } from '@/types/Genre';
import { Movie } from '@/types/Movie';
import DiscoverClient from './DiscoverClient';
import SectionTitle from '@/components/SectionTitle';
import { baseUrl } from '@/lib/config';

async function fetchAvailableGenres() {
  const res = await fetch('https://api.themoviedb.org/3/genre/movie/list', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
    next: {
      revalidate: 60 * 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading genres');
  }

  const movies: GenreResponse = await res.json();
  return movies.genres;
}

export async function fetchDiscoverMovies() {
  const res = await fetch(
    `${baseUrl}/api/discover?include_adult=false&include_video=false`,
    {
      next: {
        revalidate: 60 * 60 * 5,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Error loading discover movies');
  }

  const movies: Movie[] = await res.json();
  return movies;
}

export default async function DiscoverPage() {
  const genres = await fetchAvailableGenres();
  const movies = await fetchDiscoverMovies();

  return (
    <>
      <SectionTitle>Discover</SectionTitle>

      <DiscoverClient genres={genres} defaultMovies={movies} />
    </>
  );
}
