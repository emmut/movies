export function catalogPath(source: string) {
  if (source.startsWith('/search')) {
    return '/search/[type]/[id]' as const;
  }
  if (source.startsWith('/discover')) {
    return '/discover/[type]/[id]' as const;
  }
  return '/[type]/[id]' as const;
}
