#!/usr/bin/env tsx

/**
 * Seed a watchlist and custom list with non-pornographic films that were
 * curated for IMDb Parent's Guide's "Sex & Nudity: Severe" classification.
 *
 * Usage:
 *   pnpm seed:high-sex-nudity --email <email>
 *
 * IMDb's parent-guide classifications are community-maintained and may change.
 * This script deliberately uses a fixed, reviewable set of adult dramatic
 * films rather than discovering or scraping titles at runtime.
 */

import { randomUUID } from 'crypto';

import { and, eq } from 'drizzle-orm';

import { user } from '@/db/schema/auth';
import { listItems, lists } from '@/db/schema/lists';
import { env } from '@/env';
import { TMDB_API_URL } from '@/lib/constants';
import { db } from '@/lib/db';

type MovieSeed = {
  title: string;
  year: number;
  listKeys: ResearchListKey[];
};

type TmdbMovie = {
  id: number;
  title: string;
  release_date: string;
};

type TmdbSearchResponse = {
  results: TmdbMovie[];
};

type ResearchListKey = 'all' | 'art-house' | 'recent' | 'thrillers';

type ResearchList = {
  key: ResearchListKey;
  name: string;
  emoji: string;
  description: string;
};

type SeedListValues = {
  description?: string;
  emoji: string;
  type: 'custom' | 'watchlist';
};

const RESEARCH_LISTS: ResearchList[] = [
  {
    key: 'all',
    name: 'High Sex & Nudity',
    emoji: '🔞',
    description: "Adult dramatic films curated from IMDb Parent's Guide: Sex & Nudity — Severe.",
  },
  {
    key: 'thrillers',
    name: 'Erotic Thrillers & Neo-Noir',
    emoji: '🕵️',
    description: 'Adult thrillers and neo-noir films from the high-sex-and-nudity research set.',
  },
  {
    key: 'art-house',
    name: 'Provocative Auteur Cinema',
    emoji: '🎞️',
    description: 'International and auteur-driven films from the high-sex-and-nudity research set.',
  },
  {
    key: 'recent',
    name: 'Recent Adult Dramas',
    emoji: '🆕',
    description: 'Recent adult dramatic films from the high-sex-and-nudity research set.',
  },
];

// Non-pornographic films curated for IMDb Parent's Guide's "Sex & Nudity:
// Severe" classification. Keep title and year together to avoid ambiguous
// TMDB search results. Every title appears in the complete set plus one or
// more subject lists.
const MOVIE_SEEDS: MovieSeed[] = [
  { title: 'Last Tango in Paris', year: 1972, listKeys: ['all', 'art-house'] },
  { title: 'Dressed to Kill', year: 1980, listKeys: ['all', 'thrillers'] },
  { title: 'Body Heat', year: 1981, listKeys: ['all', 'thrillers'] },
  { title: 'Blue Velvet', year: 1986, listKeys: ['all', 'art-house', 'thrillers'] },
  { title: 'The Lover', year: 1992, listKeys: ['all', 'art-house'] },
  { title: 'Basic Instinct', year: 1992, listKeys: ['all', 'thrillers'] },
  { title: 'Crash', year: 1996, listKeys: ['all', 'art-house'] },
  { title: 'Breaking the Waves', year: 1996, listKeys: ['all', 'art-house'] },
  { title: 'Trainspotting', year: 1996, listKeys: ['all', 'art-house'] },
  { title: 'The People vs. Larry Flynt', year: 1996, listKeys: ['all', 'art-house'] },
  { title: 'Boogie Nights', year: 1997, listKeys: ['all', 'art-house'] },
  { title: 'Wild Things', year: 1998, listKeys: ['all', 'thrillers'] },
  { title: 'Eyes Wide Shut', year: 1999, listKeys: ['all', 'art-house'] },
  { title: 'Y Tu Mamá También', year: 2001, listKeys: ['all', 'art-house'] },
  { title: 'The Piano Teacher', year: 2001, listKeys: ['all', 'art-house'] },
  { title: 'In the Cut', year: 2003, listKeys: ['all', 'thrillers'] },
  { title: 'The Dreamers', year: 2003, listKeys: ['all', 'art-house'] },
  { title: 'Lust, Caution', year: 2007, listKeys: ['all', 'art-house'] },
  { title: 'Shame', year: 2011, listKeys: ['all', 'art-house'] },
  { title: 'Nymphomaniac: Vol. I', year: 2013, listKeys: ['all', 'art-house'] },
  { title: 'The Wolf of Wall Street', year: 2013, listKeys: ['all', 'recent'] },
  { title: 'Gone Girl', year: 2014, listKeys: ['all', 'thrillers', 'recent'] },
  { title: 'The Neon Demon', year: 2016, listKeys: ['all', 'thrillers', 'recent'] },
  { title: 'Fifty Shades of Grey', year: 2015, listKeys: ['all', 'recent'] },
  { title: 'The Handmaiden', year: 2016, listKeys: ['all', 'art-house', 'recent'] },
  { title: 'Benedetta', year: 2021, listKeys: ['all', 'art-house', 'recent'] },
  { title: 'Infinity Pool', year: 2023, listKeys: ['all', 'recent'] },
  { title: 'Poor Things', year: 2023, listKeys: ['all', 'art-house', 'recent'] },
  { title: 'Saltburn', year: 2023, listKeys: ['all', 'recent'] },
  { title: 'The Brutalist', year: 2024, listKeys: ['all', 'recent'] },
  { title: 'Babygirl', year: 2024, listKeys: ['all', 'recent'] },
  { title: 'Queer', year: 2024, listKeys: ['all', 'art-house', 'recent'] },
  { title: 'Anora', year: 2024, listKeys: ['all', 'recent'] },
];

function parseArgs(): { email?: string } {
  const args = process.argv.slice(2);
  const emailIndex = args.indexOf('--email');
  const email = emailIndex !== -1 ? args[emailIndex + 1] : undefined;

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

async function resolveMovie(seed: MovieSeed) {
  const url = new URL(`${TMDB_API_URL}/search/movie`);
  url.searchParams.set('query', seed.title);
  url.searchParams.set('primary_release_year', String(seed.year));
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('language', 'en-US');

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB search failed for ${seed.title} (${response.status})`);
  }

  const data = (await response.json()) as TmdbSearchResponse;
  const movie = data.results.find(
    (result) => result.title === seed.title && result.release_date.startsWith(String(seed.year)),
  );

  if (!movie) {
    throw new Error(`TMDB did not return an exact match for ${seed.title} (${seed.year})`);
  }

  return { ...movie, listKeys: seed.listKeys };
}

async function resolveMovies() {
  console.log('📥 Resolving curated movies through TMDB...');

  const movies: Array<TmdbMovie & { listKeys: ResearchListKey[] }> = [];

  for (const seed of MOVIE_SEEDS) {
    try {
      movies.push(await resolveMovie(seed));
    } catch (error) {
      console.warn(`⚠️  Skipping ${seed.title}: ${String(error)}`);
    }
  }

  if (movies.length === 0) {
    throw new Error('TMDB could not resolve any curated movies');
  }

  console.log(`   • ${movies.length} of ${MOVIE_SEEDS.length} movies resolved`);
  return movies;
}

async function getOrCreateList(userId: string, name: string, values: SeedListValues) {
  const existing = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.userId, userId), eq(lists.name, name), eq(lists.type, values.type)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const listId = randomUUID();
  await db.insert(lists).values({
    id: listId,
    userId,
    name,
    ...values,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return listId;
}

async function addMovies(listId: string, movies: TmdbMovie[]) {
  let added = 0;

  for (const movie of movies) {
    const inserted = await db
      .insert(listItems)
      .values({
        id: randomUUID(),
        listId,
        resourceId: movie.id,
        resourceType: 'movie',
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning({ id: listItems.id });

    added += inserted.length;
  }

  return added;
}

async function main() {
  const { email } = parseArgs();

  if (!email) {
    console.error('❌ Email is required');
    console.error('Usage: pnpm seed:high-sex-nudity --email <email>');
    process.exit(1);
  }

  console.log('🌱 Seeding high-sex-and-nudity movies...\n');
  const userRecord = await getUserOrCreate(email);
  console.log(`👤 User: ${userRecord.email}\n`);

  const movies = await resolveMovies();
  const watchlistId = await getOrCreateList(userRecord.id, 'Watchlist', {
    emoji: '📝',
    type: 'watchlist',
  });
  const researchListIds = await Promise.all(
    RESEARCH_LISTS.map(async (list) => ({
      ...list,
      id: await getOrCreateList(userRecord.id, list.name, {
        emoji: list.emoji,
        description: list.description,
        type: 'custom',
      }),
    })),
  );

  const [watchlistAdded, ...listResults] = await Promise.all([
    addMovies(watchlistId, movies),
    ...researchListIds.map(async (list) => ({
      name: list.name,
      added: await addMovies(
        list.id,
        movies.filter((movie) => movie.listKeys.includes(list.key)),
      ),
    })),
  ]);

  console.log(`✅ Watchlist: added ${watchlistAdded} movies`);
  for (const list of listResults) {
    console.log(`✅ ${list.name}: added ${list.added} movies`);
  }
  console.log('\n🎉 Done! Refresh the app to see the seeded lists.');
}

main().catch((error) => {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
