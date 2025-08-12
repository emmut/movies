import { getUser } from '@/lib/auth-server';
import { getWatchlistWithResourceDetails } from '@/lib/watchlist';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/watchlist/details
 * Retrieves the user's watchlist with full resource details for a specific type
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resourceType');

    if (!resourceType) {
      return NextResponse.json(
        { error: 'resourceType query parameter is required' },
        { status: 400 }
      );
    }

    if (resourceType !== 'movie' && resourceType !== 'tv') {
      return NextResponse.json(
        { error: 'resourceType must be either "movie" or "tv"' },
        { status: 400 }
      );
    }

    const watchlistWithDetails =
      await getWatchlistWithResourceDetails(resourceType);
    return NextResponse.json(watchlistWithDetails);
  } catch (error) {
    console.error('Error fetching watchlist details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist details' },
      { status: 500 }
    );
  }
}

