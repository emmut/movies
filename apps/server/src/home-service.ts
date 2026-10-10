import 'server-only';
import type { MediaCard, HomeMediaCategory } from '@movies/api/home';
import type { HomeService } from '@movies/api/router';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';

import { toMediaCard, type TmdbCard } from './media-card';

const endpoints: Record<HomeMediaCategory, string> = {
  'now-playing-movies': '/movie/now_playing',
  'on-the-air-tv': '/tv/on_the_air',
  'upcoming-movies': '/movie/upcoming',
  'popular-tv': '/tv/popular',
  'top-rated-movies': '/movie/top_rated',
  'top-rated-tv': '/tv/top_rated',
};
export function createHomeService(fetchTmdb: TmdbFetch): HomeService {
  async function load(path: string, type: MediaCard['type'], region?: string) {
    const data = await fetchTmdb<{ results: TmdbCard[] }>(path, { searchParams: { region } });
    return data.results.map((item) => toMediaCard(item, type));
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
