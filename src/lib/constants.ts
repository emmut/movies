// TMDB_API_URL_OVERRIDE is a server-only test seam: point it at a local stub
// to run the app (and e2e suite) without real TMDB access. Unset in real
// deployments.
export const TMDB_API_URL = process.env.TMDB_API_URL_OVERRIDE ?? 'https://api.themoviedb.org/3';
export const IMAGE_CDN_URL = 'https://image.tmdb.org/t/p/';
export const MIN_RUNTIME_FILTER_MINUTES = 1;
