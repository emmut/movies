export const CACHE_TAGS = {
  public: {
    home: {
      trendingMovies: 'public:home:trending:movies',
      trendingTv: 'public:home:trending:tv',
      nowPlayingMovies: 'public:home:movies:now-playing',
      upcomingMovies: 'public:home:movies:upcoming',
      topRatedMovies: 'public:home:movies:top-rated',
      onTheAirTv: 'public:home:tv:on-the-air',
      popularTv: 'public:home:tv:popular',
      topRatedTv: 'public:home:tv:top-rated',
    },
    discover: {
      movies: 'public:discover:movies',
      tv: 'public:discover:tv',
    },
    genres: {
      movies: 'public:genres:movies',
      tv: 'public:genres:tv',
    },
    watchProvidersByRegion(region: string) {
      return `public:watch-providers:${region.toLowerCase()}`;
    },
    movie: {
      details(movieId: number) {
        return `public:movie:${movieId}:details`;
      },
      credits(movieId: number) {
        return `public:movie:${movieId}:credits`;
      },
      watchProviders(movieId: number) {
        return `public:movie:${movieId}:watch-providers`;
      },
      trailer(movieId: number) {
        return `public:movie:${movieId}:trailer`;
      },
      recommendations(movieId: number) {
        return `public:movie:${movieId}:recommendations`;
      },
      similar(movieId: number) {
        return `public:movie:${movieId}:similar`;
      },
    },
    tv: {
      details(tvId: number) {
        return `public:tv:${tvId}:details`;
      },
      credits(tvId: number) {
        return `public:tv:${tvId}:credits`;
      },
      watchProviders(tvId: number) {
        return `public:tv:${tvId}:watch-providers`;
      },
      trailer(tvId: number) {
        return `public:tv:${tvId}:trailer`;
      },
      recommendations(tvId: number) {
        return `public:tv:${tvId}:recommendations`;
      },
      similar(tvId: number) {
        return `public:tv:${tvId}:similar`;
      },
      imdbId(tvId: number) {
        return `public:tv:${tvId}:imdb-id`;
      },
    },
    person: {
      details(personId: number) {
        return `public:person:${personId}:details`;
      },
      movieCredits(personId: number) {
        return `public:person:${personId}:movie-credits`;
      },
      tvCredits(personId: number) {
        return `public:person:${personId}:tv-credits`;
      },
    },
  },
  private: {
    userRegion(userId: string) {
      return `private:user:${userId}:region`;
    },
    userWatchProviders(userId: string) {
      return `private:user:${userId}:watch-providers`;
    },
    watchlistItem(userId: string, resourceType: string, resourceId: number) {
      return `private:user:${userId}:watchlist:${resourceType}:${resourceId}`;
    },
    watchlistList(userId: string, resourceType: string) {
      return `private:user:${userId}:watchlist-list:${resourceType}`;
    },
    watchlistCount(userId: string, resourceType: string) {
      return `private:user:${userId}:watchlist-count:${resourceType}`;
    },
    lists(userId: string) {
      return `private:user:${userId}:lists`;
    },
    listDetails(userId: string, listId: string) {
      return `private:user:${userId}:list:${listId}`;
    },
    listStatus(userId: string, resourceType: string, resourceId: number) {
      return `private:user:${userId}:list-status:${resourceType}:${resourceId}`;
    },
  },
} as const;
