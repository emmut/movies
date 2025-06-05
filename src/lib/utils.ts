import { IMAGE_CDN_URL } from './constants';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function formatDateYear(date: string) {
  return date.split('-')?.[0];
}

export function formatImageUrl(path: string | null, width = 500) {
  if (path === null) {
    return '';
  }
  return `${IMAGE_CDN_URL}w${width}${path}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, withSymbol = true) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: withSymbol ? 'symbol' : 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}
