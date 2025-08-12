import { getTvShowDetails } from '@/lib/tv-shows';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tv/[tvId]
 * Retrieves detailed information for a specific TV show
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tvId: string }> }
) {
  try {
    const { tvId } = await params;
    const tvIdNum = parseInt(tvId, 10);

    if (isNaN(tvIdNum)) {
      return NextResponse.json(
        { error: 'Invalid TV show ID' },
        { status: 400 }
      );
    }

    const tvShowDetails = await getTvShowDetails(tvIdNum);
    return NextResponse.json(tvShowDetails);
  } catch (error) {
    console.error('Error fetching TV show details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TV show details' },
      { status: 500 }
    );
  }
}

