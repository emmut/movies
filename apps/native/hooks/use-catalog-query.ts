import type { AppRouterClient } from '@movies/api/router';
import { orpc } from '@native/lib/api';
import { useQuery } from '@tanstack/react-query';

export function useCatalogSeason(input: Parameters<AppRouterClient['catalog']['season']>[0]) {
  return useQuery(orpc.catalog.season.queryOptions({ input, retry: false }));
}

export function useCatalogCredits(input: Parameters<AppRouterClient['catalog']['credits']>[0]) {
  return useQuery(orpc.catalog.credits.queryOptions({ input, retry: false }));
}

export function useCatalogDetails(input: Parameters<AppRouterClient['catalog']['details']>[0]) {
  return useQuery(
    orpc.catalog.details.queryOptions({
      input,
      retry: false,
    }),
  );
}

export function useCatalogRelated(input: Parameters<AppRouterClient['catalog']['related']>[0]) {
  return useQuery(orpc.catalog.related.queryOptions({ input, retry: false }));
}

export function useCatalogTrailer(input: Parameters<AppRouterClient['catalog']['trailer']>[0]) {
  return useQuery(orpc.catalog.trailer.queryOptions({ input, retry: false }));
}

export function useCatalogCollection(
  input: Parameters<AppRouterClient['catalog']['collection']>[0],
) {
  return useQuery(orpc.catalog.collection.queryOptions({ input, retry: false }));
}

export function useCatalogExtras(input: Parameters<AppRouterClient['catalog']['extras']>[0]) {
  return useQuery(orpc.catalog.extras.queryOptions({ input, retry: false }));
}

export function useCatalogKeyword(input: Parameters<AppRouterClient['catalog']['keyword']>[0]) {
  return useQuery(orpc.catalog.keyword.queryOptions({ input, retry: false }));
}

export function useCatalogWatchLinks(
  input: Parameters<AppRouterClient['catalog']['watchLinks']>[0],
) {
  return useQuery(
    orpc.catalog.watchLinks.queryOptions({
      input,
      staleTime: 86_400_000,
      retry: false,
    }),
  );
}

export function useCatalogProviders(input: Parameters<AppRouterClient['catalog']['providers']>[0]) {
  return useQuery(orpc.catalog.providers.queryOptions({ input, retry: false }));
}

export function useCatalogImdb(input: Parameters<AppRouterClient['catalog']['imdb']>[0]) {
  return useQuery(orpc.catalog.imdb.queryOptions({ input, retry: false }));
}

export function useCatalogReviews(input: Parameters<AppRouterClient['catalog']['reviews']>[0]) {
  return useQuery(
    orpc.catalog.reviews.queryOptions({
      input,
      retry: false,
    }),
  );
}

export function useCatalogResolveImdb(
  input: Parameters<AppRouterClient['catalog']['resolveImdb']>[0],
) {
  return useQuery(orpc.catalog.resolveImdb.queryOptions({ input, retry: false }));
}
