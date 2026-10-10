import 'server-only';
import type { MediaCard, HomeMediaCategory } from '@movies/api/home';
import type { HomeService } from '@movies/api/router';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';

const endpoints: Record<HomeMediaCategory, string> = {
  'now-playing-movies': '/movie/now_playing',
  'on-the-air-tv': '/tv/on_the_air',
  'upcoming-movies': '/movie/upcoming',
  'popular-tv': '/tv/popular',
  'top-rated-movies': '/movie/top_rated',
  'top-rated-tv': '/tv/top_rated',
};
type TmdbTitle = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
};
function imageUrl(path: string | null, size: string) {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
function toCard(item: TmdbTitle, type: MediaCard['type']): MediaCard {
  return {
    id: item.id,
    type,
    title: item.title ?? item.name ?? '',
    releaseDate: item.release_date ?? item.first_air_date ?? '',
    posterUrl: imageUrl(item.poster_path, 'w342'),
    backdropUrl: imageUrl(item.backdrop_path, 'w780'),
    rating: item.vote_average,
  };
}
export function createHomeService(fetchTmdb: TmdbFetch): HomeService {
  async function load(path: string, type: MediaCard['type'], region?: string) {
    const data = await fetchTmdb<{ results: TmdbTitle[] }>(path, { searchParams: { region } });
    return data.results.map((item) => toCard(item, type));
  }
  return {
    async list({ category, region }) {
      const type = category.endsWith('movies') ? 'movie' : 'tv';
      const items = await load(endpoints[category], type, region);
      if (category !== 'upcoming-movies') return items;
      const playing = await load(endpoints['now-playing-movies'], 'movie', region);
      const playingIds = new Set(playing.map((item) => item.id));
      return items.filter((item) => !playingIds.has(item.id));
    },
    trending({ type }) {
      return load(`/trending/${type}/day`, type);
    },
  };
}
