import { env } from '@/env';
import { Movie } from '@/types/movie';

const TMDB_API_URL = 'https://api.themoviedb.org/3';
const TMDB_ACCESS_TOKEN = env.MOVIE_DB_ACCESS_TOKEN;

export async function getLatestTrailers() {
  const response = await fetch(
    `${TMDB_API_URL}/movie/now_playing?language=sv-SE&page=1&region=SE`,
    {
      next: { revalidate: 3600 },
      headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch trailers');
  }

  const data = await response.json();
  const movies = data.results as Movie[];

  // Fetch trailers for each movie
  const moviesWithTrailers = await Promise.all(
    movies.map(async (movie) => {
      const trailerResponse = await fetch(
        `${TMDB_API_URL}/movie/${movie.id}/videos?language=sv-SE`,
        {
          next: { revalidate: 3600 },
          headers: {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
          },
        }
      );

      if (!trailerResponse.ok) {
        return null;
      }

      const trailerData = await trailerResponse.json();
      const trailer = trailerData.results.find(
        (video: { type: string; site: string }) =>
          (video.type === 'Trailer' || video.type === 'Teaser') &&
          video.site === 'YouTube'
      );

      if (!trailer) {
        return null;
      }

      return {
        ...movie,
        trailer_key: trailer.key,
      };
    })
  );

  return moviesWithTrailers.filter(Boolean) as (Movie & {
    trailer_key: string;
  })[];
}
