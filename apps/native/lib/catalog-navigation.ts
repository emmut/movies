type CatalogPath =
  | '/more/[type]/[id]'
  | '/search/[type]/[id]'
  | '/discover/[type]/[id]'
  | '/[type]/[id]';

export function catalogPath(source: string): CatalogPath {
  if (source.startsWith('/more')) {
    return '/more/[type]/[id]';
  }
  if (source.startsWith('/search')) {
    return '/search/[type]/[id]';
  }
  if (source.startsWith('/discover')) {
    return '/discover/[type]/[id]';
  }
  return '/[type]/[id]';
}

export function catalogReviewsPath(source: string): `${CatalogPath}/reviews` {
  return `${catalogPath(source)}/reviews` as const;
}
