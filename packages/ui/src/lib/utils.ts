import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const IMAGE_CDN_URL = "https://image.tmdb.org/t/p/";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateYear(date: string) {
  return date.split("-")?.[0];
}

export function formatImageUrl(path: string | null, width = 500) {
  if (path === null) return "";
  return `${IMAGE_CDN_URL}w${width}${path}`;
}

export function formatCurrency(amount: number, withSymbol = true) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: withSymbol ? "symbol" : "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

export function deduplicateAndSortByPopularity<T extends { id: number; popularity: number }>(
  items: T[],
  getDateString: (item: T) => string,
): T[] {
  return items
    .filter((item, index, self) => index === self.findIndex((i) => i.id === item.id))
    .sort((a, b) => {
      if (b.popularity !== a.popularity) return b.popularity - a.popularity;
      return (
        new Date(getDateString(b) || "1900-01-01").getTime() -
        new Date(getDateString(a) || "1900-01-01").getTime()
      );
    });
}

export function isValidRedirectUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("/") && !url.includes("://") && !url.startsWith("//");
}

export function getSafeRedirectUrl(url?: string) {
  return url && isValidRedirectUrl(url) ? url : "/";
}

export function createLoginUrl(redirectUrl?: string) {
  if (redirectUrl === undefined || !isValidRedirectUrl(redirectUrl)) return "/";
  return `/login?redirect_url=${encodeURIComponent(redirectUrl)}`;
}
