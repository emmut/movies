#!/usr/bin/env tsx

/**
 * Script to list all available watch providers from TMDB API
 *
 * Usage: pnpm run list-providers [region]
 * Example: pnpm run list-providers SE
 */

const TMDB_API_URL = 'https://api.themoviedb.org/3';

type WatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
};

type WatchProvidersResponse = {
  results: WatchProvider[];
};

async function fetchFromTMDB(endpoint: string): Promise<WatchProvidersResponse> {
  const response = await fetch(`${TMDB_API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${process.env.MOVIE_DB_ACCESS_TOKEN}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  // Normalize and validate region input
  const rawRegion = process.argv[2];
  const region = rawRegion ? rawRegion.toUpperCase() : undefined;
  if (region && !/^[A-Z]{2}$/.test(region)) {
    console.error('❌ Invalid region. Use a two-letter ISO 3166-1 code, e.g., US, SE, GB.');
    process.exit(1);
  }

  console.log('🎬 TMDB Watch Providers');
  console.log('='.repeat(50));

  if (region) {
    console.log(`📍 Region: ${region}`);
  } else {
    console.log('🌍 All regions');
  }
  console.log('');

  try {
    if (!process.env.MOVIE_DB_ACCESS_TOKEN) {
      console.error('❌ Missing MOVIE_DB_ACCESS_TOKEN in environment.');
      process.exit(1);
    }
    // Fetch movie and TV providers
    const movieEndpoint = region
      ? `/watch/providers/movie?watch_region=${region}`
      : '/watch/providers/movie';
    const tvEndpoint = region
      ? `/watch/providers/tv?watch_region=${region}`
      : '/watch/providers/tv';

    const [movieData, tvData] = await Promise.all([
      fetchFromTMDB(movieEndpoint),
      fetchFromTMDB(tvEndpoint),
    ]);

    const movieProviders = movieData.results || [];
    const tvProviders = tvData.results || [];

    // Display movie providers
    console.log('🎬 MOVIE PROVIDERS');
    console.log('─'.repeat(90));
    console.log('│      ID      │   Priority   │           Provider Name            │');
    console.log('├──────────────┼──────────────┼────────────────────────────────────┤');
    movieProviders
      .sort((a, b) => a.display_priority - b.display_priority)
      .forEach((provider) => {
        const id = provider.provider_id.toString().padStart(12);
        const priority = provider.display_priority.toString().padStart(12);
        const name =
          provider.provider_name.length > 34
            ? provider.provider_name.substring(0, 31) + '...'
            : provider.provider_name.padEnd(34);
        console.log(`│${id} │${priority} │ ${name} │`);
      });
    console.log('└──────────────┴──────────────┴────────────────────────────────────┘');

    console.log('');

    // Display TV providers
    console.log('📺 TV PROVIDERS');
    console.log('─'.repeat(90));
    console.log('│      ID      │   Priority   │           Provider Name            │');
    console.log('├──────────────┼──────────────┼────────────────────────────────────┤');
    tvProviders
      .sort((a, b) => a.display_priority - b.display_priority)
      .forEach((provider) => {
        const id = provider.provider_id.toString().padStart(12);
        const priority = provider.display_priority.toString().padStart(12);
        const name =
          provider.provider_name.length > 34
            ? provider.provider_name.substring(0, 31) + '...'
            : provider.provider_name.padEnd(34);
        console.log(`│${id} │${priority} │ ${name} │`);
      });
    console.log('└──────────────┴──────────────┴────────────────────────────────────┘');

    console.log('');
    console.log(`📊 Movie providers: ${movieProviders.length}`);
    console.log(`📊 TV providers: ${tvProviders.length}`);

    // Find common providers
    const movieProviderIds = new Set(movieProviders.map((p) => p.provider_id));
    const commonProviders = tvProviders.filter((p) => movieProviderIds.has(p.provider_id));
    console.log(`📊 Common providers: ${commonProviders.length}`);

    // Show available regions if no region specified
    if (!region) {
      console.log('');
      console.log('💡 Available regions (examples):');
      console.log('   SE (Sweden), US (United States), GB (United Kingdom)');
      console.log('   Usage: pnpm run list-providers SE');
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch(console.error);
