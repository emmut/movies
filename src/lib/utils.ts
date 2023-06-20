import { IMAGE_CDN_URL } from './constants';

export function formatDateYear(date: string) {
  return date.split('-')?.[0];
}

export function formatImageUrl(path: string, width = 500) {
  return `${IMAGE_CDN_URL}w${width}${path}`;
}
