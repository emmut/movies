import { getUser } from '@/lib/auth-server';
import { isResourceInWatchlist } from '@/lib/watchlist';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/watchlist/check
 * Checks if a specific resource is in the user's watchlist
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceIdParam = searchParams.get('resourceId');
    const resourceType = searchParams.get('resourceType');

    if (!resourceIdParam || !resourceType) {
      return NextResponse.json(
        { error: 'resourceId and resourceType query parameters are required' },
        { status: 400 }
      );
    }

    const resourceId = parseInt(resourceIdParam, 10);
    if (isNaN(resourceId)) {
      return NextResponse.json(
        { error: 'resourceId must be a valid number' },
        { status: 400 }
      );
    }

    const isInWatchlist = await isResourceInWatchlist(resourceId, resourceType);
    return NextResponse.json({ isInWatchlist });
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to check watchlist status' },
      { status: 500 }
    );
  }
}

