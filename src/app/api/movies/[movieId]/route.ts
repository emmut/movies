import { getMovieDetails } from '@/lib/movies';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/movies/[movieId]
 * Retrieves detailed information for a specific movie
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const { movieId } = await params;
    const movieIdNum = parseInt(movieId, 10);

    if (isNaN(movieIdNum)) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
    }

    const movieDetails = await getMovieDetails(movieIdNum);
    return NextResponse.json(movieDetails);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    );
  }
}

