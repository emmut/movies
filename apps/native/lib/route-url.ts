/** `[id]` and `[...rest]` segments name the params `id` and `rest`. */
function routeParamName(segment: string) {
  return segment
    .replaceAll('[', '')
    .replaceAll(']', '')
    .replace(/^\.\.\./, '');
}

function routeParamNames(segments: readonly string[]) {
  const dynamicSegments = segments.filter((segment) => segment.startsWith('['));
  return new Set(dynamicSegments.map(routeParamName));
}

/** Route parameters are already represented in the pathname; preserve the query separately. */
export function routeUrl(
  pathname: string,
  params: Record<string, string | string[] | undefined>,
  segments: readonly string[],
) {
  const routeParams = routeParamNames(segments);
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
  if (!search) {
    return pathname;
  }
  return `${pathname}?${search}`;
}
