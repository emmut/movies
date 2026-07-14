import type { MovieReleaseDatesResult, TvContentRatingsResult } from '@/types/certification';

// Pure pickers shared by the movie and TV fetchers; kept free of 'server-only'
// so unit tests can import them directly.

export type Certification = {
  value: string;
  region: string;
};

function movieCertForRegion(results: MovieReleaseDatesResult[], region: string) {
  const entry = results.find((result) => result.iso_3166_1 === region);
  if (!entry) {
    return null;
  }
  // Prefer theatrical releases (types 2 and 3) over digital/physical/other.
  const theatrical = entry.release_dates.find(
    (date) => date.certification !== '' && (date.type === 2 || date.type === 3),
  );
  if (theatrical) {
    return { value: theatrical.certification, region };
  }
  const any = entry.release_dates.find((date) => date.certification !== '');
  if (any) {
    return { value: any.certification, region };
  }
  return null;
}

/**
 * Picks a movie age certification from TMDb release dates, preferring the
 * user's region and falling back to the US rating.
 *
 * @param results - The per-country results from `/movie/{id}/release_dates`.
 * @param region - The preferred ISO 3166-1 region code.
 * @returns The certification and the region it came from, or null when neither region has one.
 */
export function pickMovieCertification(
  results: MovieReleaseDatesResult[],
  region: string,
): Certification | null {
  return movieCertForRegion(results, region) ?? movieCertForRegion(results, 'US');
}

function tvCertForRegion(results: TvContentRatingsResult[], region: string) {
  const rating = results.find((result) => result.iso_3166_1 === region)?.rating;
  if (rating) {
    return { value: rating, region };
  }
  return null;
}

/**
 * Picks a TV age rating from TMDb content ratings, preferring the user's
 * region and falling back to the US rating.
 *
 * @param results - The per-country results from `/tv/{id}/content_ratings`.
 * @param region - The preferred ISO 3166-1 region code.
 * @returns The rating and the region it came from, or null when neither region has one.
 */
export function pickTvCertification(
  results: TvContentRatingsResult[],
  region: string,
): Certification | null {
  return tvCertForRegion(results, region) ?? tvCertForRegion(results, 'US');
}

/**
 * Formats a certification for display, qualifying it with the source region
 * only when it fell back to another region's rating.
 *
 * @param certification - The picked certification, or null when unknown.
 * @param userRegion - The region the user asked for.
 * @returns A label like "15" or "R (US)", or null when there is nothing to show.
 */
export function formatCertification(certification: Certification | null, userRegion: string) {
  if (!certification) {
    return null;
  }
  if (certification.region === userRegion) {
    return certification.value;
  }
  return `${certification.value} (${certification.region})`;
}
