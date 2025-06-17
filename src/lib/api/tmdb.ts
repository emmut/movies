import { env } from '@/env';
import { Movie } from '@/types/movie';
import { TvShow } from '@/types/tv-show';
import { DEFAULT_REGION } from '../regions';

const TMDB_API_URL = 'https://api.themoviedb.org/3';
const TMDB_ACCESS_TOKEN = env.MOVIE_DB_ACCESS_TOKEN;

type TrailerItem =
  | (Movie & { media_type: 'movie' })
  | (TvShow & { media_type: 'tv' });
type TrailerItemWithKey = TrailerItem & { trailer_key: string };

type GetLatestTrailersParams = {
  mediaType: 'movie' | 'tv';
  region?: string;
  page: number;
};

export async function getLatestTrailers({
  mediaType,
  region = DEFAULT_REGION,
  page,
}: GetLatestTrailersParams) {
  const endpoint =
    mediaType === 'movie' ? '/movie/now_playing' : '/tv/on_the_air';

  const response = await fetch(
    `${TMDB_API_URL}${endpoint}?language=en-US&page=${page}&region=${region}`,
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
  const items =
    mediaType === 'movie'
      ? (data.results as Movie[]).map((item) => ({
          ...item,
          media_type: 'movie' as const,
        }))
      : (data.results as TvShow[]).map((item) => ({
          ...item,
          media_type: 'tv' as const,
        }));

  const itemsWithTrailers = await Promise.all(
    items.map(async (item) => {
      const trailerResponse = await fetch(
        `${TMDB_API_URL}/${mediaType}/${item.id}/videos?language=en-US`,
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

      // Be more flexible with video types for TV shows
      const trailer = trailerData.results.find(
        (video: { type: string; site: string; key: string }) => {
          if (mediaType === 'tv') {
            // For TV shows, accept more video types
            return (
              (video.type === 'Trailer' ||
                video.type === 'Teaser' ||
                video.type === 'Clip' ||
                video.type === 'Featurette') &&
              video.site === 'YouTube'
            );
          } else {
            // For movies, keep strict filtering
            return (
              (video.type === 'Trailer' || video.type === 'Teaser') &&
              video.site === 'YouTube'
            );
          }
        }
      );

      if (!trailer) {
        return null;
      }

      return {
        ...item,
        trailer_key: trailer.key,
      };
    })
  );

  const validTrailers = itemsWithTrailers.filter(
    Boolean
  ) as TrailerItemWithKey[];

  // Ensure the number of trailers is divisible by 3 for better grid layout
  const trailersCount = validTrailers.length;
  const remainder = trailersCount % 3;
  const adjustedTrailers =
    remainder === 0
      ? validTrailers
      : validTrailers.slice(0, trailersCount - remainder);

  // Limit total pages to avoid too many API calls
  const totalPages = Math.min(data.total_pages, 10);

  return {
    trailers: adjustedTrailers,
    totalPages,
  };
}
