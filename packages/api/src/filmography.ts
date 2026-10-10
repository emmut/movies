export function deduplicateAndSortByPopularity<T extends { id: number; popularity: number }>(
  items: T[],
  getDateString: (item: T) => string,
): T[] {
  return items
    .filter((item, index, self) => index === self.findIndex((i) => i.id === item.id))
    .sort((a, b) => {
      // Sort by popularity first, then by date
      if (b.popularity !== a.popularity) {
        return b.popularity - a.popularity;
      }
      return (
        new Date(getDateString(b) || '1900-01-01').getTime() -
        new Date(getDateString(a) || '1900-01-01').getTime()
      );
    });
}
