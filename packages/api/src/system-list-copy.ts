export const SYSTEM_LIST_COPY = {
  watchlist: {
    title: 'My Watchlist',
    countNoun: 'saved',
    emptyTitleAll: 'Your watchlist is empty',
    emptyTitleMedia(media: string) {
      return `No ${media} in your watchlist`;
    },
    emptyHintAll(media: string) {
      return `Start adding ${media} by clicking the star on any detail page`;
    },
    emptyHintMedia(media: string) {
      return `Add some ${media} to see them here`;
    },
  },
  watched: {
    title: 'Watched',
    countNoun: 'watched',
    emptyTitleAll: "You haven't watched anything yet",
    emptyTitleMedia(media: string) {
      return `No ${media} watched yet`;
    },
    emptyHintAll(media: string) {
      return `Mark ${media} as watched from any detail page to track them here`;
    },
    emptyHintMedia(media: string) {
      return `Mark some ${media} as watched to see them here`;
    },
  },
};
export const SYSTEM_LIST_MEDIA = {
  movie: { emoji: '🎬', label: 'movies', exploreLabel: 'Explore Movies', countNoun: 'movie' },
  tv: { emoji: '📺', label: 'TV shows', exploreLabel: 'Explore TV Shows', countNoun: 'TV show' },
} as const;
