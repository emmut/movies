import type { SystemListType } from './validations';

/** How the reader interacts with the page: web says clicking, native says tapping. */
export type SystemListInteraction = 'clicking' | 'tapping';

export type SystemListCopy = {
  title: string;
  countNoun: string;
  emptyTitleAll: string;
  emptyTitleMedia(media: string): string;
  emptyHintAll(media: string, interaction?: SystemListInteraction): string;
  emptyHintMedia(media: string): string;
};

export const SYSTEM_LIST_COPY: Record<SystemListType, SystemListCopy> = {
  watchlist: {
    title: 'My Watchlist',
    countNoun: 'saved',
    emptyTitleAll: 'Your watchlist is empty',
    emptyTitleMedia(media: string) {
      return `No ${media} in your watchlist`;
    },
    emptyHintAll(media: string, interaction: SystemListInteraction = 'clicking') {
      return `Start adding ${media} by ${interaction} the star on any detail page`;
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
  movie: {
    emoji: '🎬',
    label: 'movies',
    tabLabel: 'Movies',
    exploreLabel: 'Explore Movies',
    countNoun: 'movie',
  },
  tv: {
    emoji: '📺',
    label: 'TV shows',
    tabLabel: 'TV Shows',
    exploreLabel: 'Explore TV Shows',
    countNoun: 'TV show',
  },
} as const;
