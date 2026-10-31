import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/components/image-proxy', () => ({ Imgproxy: () => null }));
vi.mock('@/components/cast-slider', () => ({ CastSlider: () => <div>Cast preview</div> }));
vi.mock('@/lib/movies', () => ({ getMovieCredits: vi.fn(), getMovieDetails: vi.fn() }));

import MovieCrewPage from '@/app/movie/[movieId]/crew/page';
import { CrewList } from '@/components/crew-list';
import { groupCrewMembers } from '@/lib/crew-members';
import { getMovieCredits, getMovieDetails } from '@/lib/movies';
import type { CrewMember } from '@/types/movie';

import { MovieCredits } from './movie-credits';

function member(id: number, job: string, department = 'Writing'): CrewMember {
  return {
    id,
    name: `Person ${id}`,
    job,
    department,
    credit_id: `${id}-${job}`,
    adult: false,
    gender: 0,
    known_for_department: department,
    original_name: `Person ${id}`,
    popularity: 0,
    profile_path: null,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('movie credits', () => {
  it('merges distinct jobs per person in billing order without changing the source', () => {
    const crew = [
      member(2, 'Screenplay'),
      member(1, 'Story'),
      member(2, 'Story'),
      member(2, 'Screenplay'),
    ];
    const original = structuredClone(crew);
    expect(groupCrewMembers(crew).map(({ id, jobs }) => ({ id, jobs }))).toEqual([
      { id: 2, jobs: ['Screenplay', 'Story'] },
      { id: 1, jobs: ['Story'] },
    ]);
    expect(crew).toEqual(original);
    expect(groupCrewMembers([])).toEqual([]);
  });

  it('shows one linked writer row per person and links to full crew without an accordion', async () => {
    vi.mocked(getMovieCredits).mockResolvedValue({
      id: 10,
      cast: [],
      crew: [
        member(1, 'Screenplay'),
        member(1, 'Story'),
        member(2, 'Director', 'Directing'),
        member(3, 'Producer', 'Production'),
      ],
    });
    const html = renderToStaticMarkup(await MovieCredits({ movieId: 10 }));
    expect(html.match(/Person 1/g)).toHaveLength(1);
    expect(html).toContain('Screenplay · Story');
    expect(html).toContain('href="/person/1"');
    expect(html).toContain('href="/movie/10/crew"');
    expect(html).toContain('Directors');
    expect(html).not.toContain('Person 3');
    expect(html).not.toContain('<details');
    expect(html).toContain('Cast preview');
  });

  it('hides empty crew sections while keeping cast', async () => {
    vi.mocked(getMovieCredits).mockResolvedValue({ id: 10, cast: [], crew: [] });
    const html = renderToStaticMarkup(await MovieCredits({ movieId: 10 }));
    expect(html).not.toContain('View all crew');
    expect(html).not.toContain('Writers');
    expect(html).toContain('Cast preview');
  });

  it('still exposes full crew when no directors or writers are listed', async () => {
    vi.mocked(getMovieCredits).mockResolvedValue({
      id: 10,
      cast: [],
      crew: [member(1, 'Producer')],
    });
    expect(renderToStaticMarkup(await MovieCredits({ movieId: 10 }))).toContain('View all crew');
  });

  it('degrades gracefully when the optional request fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      vi.mocked(getMovieCredits).mockRejectedValue(new Error('TMDB unavailable'));
      expect(renderToStaticMarkup(await MovieCredits({ movieId: 10 }))).toBe(
        '<div>Cast preview</div>',
      );
    } finally {
      log.mockRestore();
    }
  });

  it('provides an accessible fallback portrait and handles long names', () => {
    const person = { ...member(1, 'Story'), name: 'A'.repeat(200) };
    const html = renderToStaticMarkup(<CrewList crew={[person]} />);
    expect(html).toContain(person.name);
    expect(html).toContain('wrap-anywhere');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('href="/person/1"');
  });
});

describe('full crew page', () => {
  beforeEach(() =>
    vi
      .mocked(getMovieDetails)
      .mockResolvedValue({ title: 'Example movie' } as Awaited<ReturnType<typeof getMovieDetails>>),
  );

  it('groups all credits alphabetically by department and combines jobs only within each department', async () => {
    vi.mocked(getMovieCredits).mockResolvedValue({
      id: 10,
      cast: [],
      crew: [
        member(1, 'Screenplay'),
        member(1, 'Story'),
        member(2, 'Producer', 'Production'),
        member(1, 'Director', 'Directing'),
        member(3, 'Consultant', ''),
      ],
    });
    const html = renderToStaticMarkup(
      await MovieCrewPage({ params: Promise.resolve({ movieId: '10' }) }),
    );
    expect(html).toContain('Back to Example movie');
    expect(html).toContain('href="/movie/10"');
    expect(html).toContain('Screenplay · Story');
    expect(html).toContain('Producer');
    expect(html).toContain('Other');
    expect(html.indexOf('>Directing<')).toBeLessThan(html.indexOf('>Production<'));
    expect(html.match(/Person 1/g)).toHaveLength(2);
  });

  it('shows an empty state', async () => {
    vi.mocked(getMovieCredits).mockResolvedValue({ id: 10, cast: [], crew: [] });
    const html = renderToStaticMarkup(
      await MovieCrewPage({ params: Promise.resolve({ movieId: '10' }) }),
    );
    expect(html).toContain('No crew information available.');
  });

  it.each(['invalid', '0', '-1', '1.5'])(
    'rejects invalid movie id %s before fetching',
    async (movieId) => {
      await expect(MovieCrewPage({ params: Promise.resolve({ movieId }) })).rejects.toThrow();
      expect(getMovieCredits).not.toHaveBeenCalled();
    },
  );
});
