#!/usr/bin/env tsx

/**
 * Seed script for watchlist and lists
 *
 * Usage:
 *   pnpm seed --email <email>
 *
 * Find your email in the app dashboard, then run this script to seed data to that user.
 * Refresh the page to see the seeded data.
 */

import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';

import { lists, listItems } from '@/db/schema/lists';
import { user } from '@/db/schema/auth';
import { db } from '@/lib/db';
import { env } from '@/env';
import { TMDB_API_URL } from '@/lib/constants';

type TmdbMovie = {
  id: number;
  title: string;
  poster_path: string | null;
};

type TmdbTv = {
  id: number;
  name: string;
  poster_path: string | null;
};

type TmdbPerson = {
  id: number;
  name: string;
  profile_path: string | null;
};

type TmdbTrendingMoviesResponse = {
  results: TmdbMovie[];
};

type TmdbTrendingTvResponse = {
  results: TmdbTv[];
};

type TmdbPopularPersonsResponse = {
  results: TmdbPerson[];
};

function parseArgs(): { email?: string } {
  const args = process.argv.slice(2);
  
  const emailIndex = args.indexOf('--email');
  const email = emailIndex !== -1 && args[emailIndex + 1] ? args[emailIndex + 1] : undefined;
  
  return { email };
}

async function getUserOrCreate(email: string) {
  const result = await db.select().from(user).where(eq(user.email, email)).limit(1);
  
  if (result.length > 0) {
    return result[0];
  }
  
  const userId = randomUUID();
  const name = email.split('@')[0];
  
  await db.insert(user).values({
    id: userId,
    name,
    email,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return { id: userId, name, email };
}

async function fetchTmdbData() {
  console.log('📥 Fetching TMDB data...');
  
  const headers = {
    Authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    Accept: 'application/json',
  };
  
  // Fetch multiple pages to get more data
  const [moviesPage1, moviesPage2, moviesPage3, tvPage1, tvPage2, tvPage3, personsPage1, personsPage2] = await Promise.all([
    fetch(`${TMDB_API_URL}/trending/movie/day?page=1`, { headers }).then((r) => r.json() as Promise<TmdbTrendingMoviesResponse>),
    fetch(`${TMDB_API_URL}/trending/movie/day?page=2`, { headers }).then((r) => r.json() as Promise<TmdbTrendingMoviesResponse>),
    fetch(`${TMDB_API_URL}/trending/movie/day?page=3`, { headers }).then((r) => r.json() as Promise<TmdbTrendingMoviesResponse>),
    fetch(`${TMDB_API_URL}/trending/tv/day?page=1`, { headers }).then((r) => r.json() as Promise<TmdbTrendingTvResponse>),
    fetch(`${TMDB_API_URL}/trending/tv/day?page=2`, { headers }).then((r) => r.json() as Promise<TmdbTrendingTvResponse>),
    fetch(`${TMDB_API_URL}/trending/tv/day?page=3`, { headers }).then((r) => r.json() as Promise<TmdbTrendingTvResponse>),
    fetch(`${TMDB_API_URL}/person/popular?page=1`, { headers }).then((r) => r.json() as Promise<TmdbPopularPersonsResponse>),
    fetch(`${TMDB_API_URL}/person/popular?page=2`, { headers }).then((r) => r.json() as Promise<TmdbPopularPersonsResponse>),
  ]);
  
  const movies = [...moviesPage1.results, ...moviesPage2.results, ...moviesPage3.results].slice(0, 60);
  const tvShows = [...tvPage1.results, ...tvPage2.results, ...tvPage3.results].slice(0, 60);
  const persons = [...personsPage1.results, ...personsPage2.results].slice(0, 40);
  
  console.log(`   • ${movies.length} movies`);
  console.log(`   • ${tvShows.length} TV shows`);
  console.log(`   • ${persons.length} persons`);
  
  return { movies, tvShows, persons };
}

function randomSelect<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function getOrCreateWatchlistList(userId: string) {
  const existing = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.userId, userId), eq(lists.type, 'watchlist')))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const listId = randomUUID();
  await db.insert(lists).values({
    id: listId,
    userId,
    name: 'Watchlist',
    type: 'watchlist',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return listId;
}

async function seedWatchlist(userId: string, movies: TmdbMovie[], tvShows: TmdbTv[]) {
  const selectedMovies = randomSelect(movies, 50);
  const selectedTv = randomSelect(tvShows, 30);

  const listId = await getOrCreateWatchlistList(userId);

  const watchlistItems = [
    ...selectedMovies.map((m) => ({
      id: randomUUID(),
      listId,
      resourceId: m.id,
      resourceType: 'movie' as const,
      createdAt: new Date(),
    })),
    ...selectedTv.map((t) => ({
      id: randomUUID(),
      listId,
      resourceId: t.id,
      resourceType: 'tv' as const,
      createdAt: new Date(),
    })),
  ];

  for (const item of watchlistItems) {
    await db
      .insert(listItems)
      .values(item)
      .onConflictDoNothing();
  }

  return {
    movies: selectedMovies.length,
    tv: selectedTv.length,
    total: watchlistItems.length,
  };
}

async function createList(
  userId: string,
  name: string,
  emoji: string,
  description: string,
  items: Array<{ resourceId: number; resourceType: 'movie' | 'tv' | 'person' }>,
) {
  const listId = randomUUID();
  
  await db.insert(lists).values({
    id: listId,
    userId,
    name,
    emoji,
    description,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  for (const item of items) {
    await db
      .insert(listItems)
      .values({
        id: randomUUID(),
        listId,
        resourceId: item.resourceId,
        resourceType: item.resourceType,
        createdAt: new Date(),
      })
      .onConflictDoNothing();
  }
  
  return { listId, name, emoji, itemCount: items.length };
}

async function seedLists(
  userId: string,
  movies: TmdbMovie[],
  tvShows: TmdbTv[],
  persons: TmdbPerson[],
) {
  const listsCreated = [];
  
  // Favorites - 100 items (mix of movies and TV)
  const favMovies = randomSelect(movies, 60);
  const favTv = randomSelect(tvShows, 40);
  const favorites = await createList(
    userId,
    'Favorites',
    '🌟',
    'My favorite movies and shows',
    [
      ...favMovies.map((m) => ({ resourceId: m.id, resourceType: 'movie' as const })),
      ...favTv.map((t) => ({ resourceId: t.id, resourceType: 'tv' as const })),
    ],
  );
  listsCreated.push(favorites);
  
  // To Watch Later - 100 items
  const watchLaterMovies = randomSelect(movies, 60);
  const watchLaterTv = randomSelect(tvShows, 40);
  const watchLater = await createList(
    userId,
    'To Watch Later',
    '📺',
    'Trending content to watch',
    [
      ...watchLaterMovies.map((m) => ({ resourceId: m.id, resourceType: 'movie' as const })),
      ...watchLaterTv.map((t) => ({ resourceId: t.id, resourceType: 'tv' as const })),
    ],
  );
  listsCreated.push(watchLater);
  
  // Great Performances - 50 items (persons + their works)
  const perfPersons = randomSelect(persons, 20);
  const perfMovies = randomSelect(movies, 20);
  const perfTv = randomSelect(tvShows, 10);
  const performances = await createList(
    userId,
    'Great Performances',
    '🎭',
    'Amazing actors and directors',
    [
      ...perfPersons.map((p) => ({ resourceId: p.id, resourceType: 'person' as const })),
      ...perfMovies.map((m) => ({ resourceId: m.id, resourceType: 'movie' as const })),
      ...perfTv.map((t) => ({ resourceId: t.id, resourceType: 'tv' as const })),
    ],
  );
  listsCreated.push(performances);
  
  // Classic Movies - 75 items
  const classicMovies = randomSelect(movies, 75);
  const classics = await createList(
    userId,
    'Classic Movies',
    '🎬',
    'Timeless cinema',
    classicMovies.map((m) => ({ resourceId: m.id, resourceType: 'movie' as const })),
  );
  listsCreated.push(classics);
  
  // TV Binge List - 75 items
  const bingeTv = randomSelect(tvShows, 75);
  const bingeList = await createList(
    userId,
    'TV Binge List',
    '🍿',
    'Perfect for a weekend binge',
    bingeTv.map((t) => ({ resourceId: t.id, resourceType: 'tv' as const })),
  );
  listsCreated.push(bingeList);
  
  return listsCreated;
}

async function main() {
  console.log('🌱 Seeding watchlist and lists...\n');
  
  const args = parseArgs();
  
  if (!args.email) {
    console.error('❌ Email is required');
    console.error('Usage: pnpm seed --email <email>');
    process.exit(1);
  }
  
  const userRecord = await getUserOrCreate(args.email);
  console.log(`👤 User: ${userRecord.id}`);
  console.log(`   Name: ${userRecord.name}`);
  console.log(`   Email: ${userRecord.email}`);
  console.log('');
  
  const tmdbData = await fetchTmdbData();
  console.log('');
  
  const watchlistResult = await seedWatchlist(userRecord.id, tmdbData.movies, tmdbData.tvShows);
  console.log(`✅ Watchlist: Added ${watchlistResult.total} items (${watchlistResult.movies} movies, ${watchlistResult.tv} TV)`);
  
  const listsResult = await seedLists(userRecord.id, tmdbData.movies, tmdbData.tvShows, tmdbData.persons);
  for (const list of listsResult) {
    console.log(`✅ List: "${list.name}" ${list.emoji} (${list.itemCount} items)`);
  }
  
  console.log('\n🎉 Done!');
  console.log('\n💡 If logged in as this user, refresh the page to see the data.');
  console.log('   Lists have 50-100 items each for testing pagination (24 items/page = 2-5 pages).\n');
}

main().catch((error) => {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
