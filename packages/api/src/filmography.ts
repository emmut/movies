const FALLBACK_DATE = '1900-01-01';

export function deduplicateAndSortByPopularity<T extends { id: number; popularity: number }>(
  items: T[],
  getDateString: (item: T) => string,
): T[] {
  function timeOf(item: T) {
    return new Date(getDateString(item) || FALLBACK_DATE).getTime();
  }
  return items
    .filter((item, index, self) => index === self.findIndex((i) => i.id === item.id))
    .sort((a, b) => {
      if (b.popularity !== a.popularity) {
        return b.popularity - a.popularity;
      }
      return timeOf(b) - timeOf(a);
    });
}
