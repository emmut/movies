import type { PdpExtras } from '@/types/pdp';
import type { TmdbVideo } from '@/types/tmdb-video';

const GALLERY_IMAGES_PER_TYPE = 8;
const MAX_VIDEOS = 12;
const YOUTUBE_KEY_PATTERN = /^[\w-]+$/;
const RELEASE_TYPES: Record<number, string> = {
  1: 'Premiere',
  2: 'Limited theatrical',
  3: 'Theatrical',
  4: 'Digital',
  5: 'Physical',
  6: 'TV',
};

export function getGalleryImages(images: PdpExtras['images']) {
  if (!images) {
    return [];
  }
  const backdrops = images.backdrops.slice(0, GALLERY_IMAGES_PER_TYPE);
  const posters = images.posters.slice(0, GALLERY_IMAGES_PER_TYPE);
  return [...backdrops, ...posters];
}

function isPlayableVideo(video: TmdbVideo) {
  return video.site === 'YouTube' && YOUTUBE_KEY_PATTERN.test(video.key);
}

function videoPriority(video: TmdbVideo) {
  const type = video.type === 'Trailer' ? 0 : video.type === 'Teaser' ? 1 : 2;
  return type * 2 + (video.official ? 0 : 1);
}

export function getPlayableVideos(videos: PdpExtras['videos']) {
  if (!videos) {
    return [];
  }
  const sorted = videos.results
    .filter(isPlayableVideo)
    .toSorted((a, b) => videoPriority(a) - videoPriority(b));
  const unique = new Map<string, TmdbVideo>();
  for (const video of sorted) {
    if (!unique.has(video.key)) {
      unique.set(video.key, video);
    }
  }
  return [...unique.values()].slice(0, MAX_VIDEOS);
}

export function getKeywords(keywords: PdpExtras['keywords']) {
  if (!keywords) {
    return [];
  }
  return keywords.keywords ?? keywords.results ?? [];
}

export function getRegionalReleases(releases: PdpExtras['release_dates'], region: string) {
  const regionalRelease = releases?.results.find((release) => release.iso_3166_1 === region);
  if (!regionalRelease) {
    return [];
  }

  const datesByTypeAndDay = new Map<string, { key: string; label: string; date: string }>();
  for (const release of regionalRelease.release_dates) {
    const date = release.release_date.slice(0, 10);
    const key = `${release.type}:${date}`;
    datesByTypeAndDay.set(key, { key, label: RELEASE_TYPES[release.type] ?? 'Release', date });
  }
  return [...datesByTypeAndDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}
