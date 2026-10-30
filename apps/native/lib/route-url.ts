/** Route parameters are already represented in the pathname; preserve the query separately. */
export function routeUrl(
  pathname: string,
  params: Record<string, string | string[] | undefined>,
  segments: readonly string[],
) {
  const routeParams = new Set(
    segments
      .filter((segment) => segment.startsWith('['))
      .map((segment) =>
        segment
          .replaceAll('[', '')
          .replaceAll(']', '')
          .replace(/^\.\.\./, ''),
      ),
  );
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (routeParams.has(key) || value === undefined) {
      continue;
    }
    const values = Array.isArray(value) ? value : [value];
    for (const entry of values) {
      query.append(key, entry);
    }
  }
  const search = query.toString();
  return search ? pathname + '?' + search : pathname;
}
