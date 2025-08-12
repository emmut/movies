import { getUser } from '@/lib/auth-server';
import { getUserWatchlist } from '@/lib/watchlist';
import { addToWatchlist, removeFromWatchlist } from '@/lib/watchlist-actions';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/watchlist
 * Retrieves the authenticated user's complete watchlist
 */
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const watchlist = await getUserWatchlist();
    return NextResponse.json(watchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/watchlist
 * Adds a resource to the user's watchlist
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { resourceId, resourceType } = body;

    if (!resourceId || !resourceType) {
      return NextResponse.json(
        { error: 'resourceId and resourceType are required' },
        { status: 400 }
      );
    }

    const result = await addToWatchlist({ resourceId, resourceType });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error adding to watchlist:', error);

    if (
      error instanceof Error &&
      error.message.includes('already in watchlist')
    ) {
      return NextResponse.json(
        { error: 'Resource already in watchlist' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/watchlist
 * Removes a resource from the user's watchlist
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { resourceId, resourceType } = body;

    if (!resourceId || !resourceType) {
      return NextResponse.json(
        { error: 'resourceId and resourceType are required' },
        { status: 400 }
      );
    }

    const result = await removeFromWatchlist({ resourceId, resourceType });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}

