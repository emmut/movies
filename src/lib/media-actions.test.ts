import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./movies', () => ({ fetchAvailableGenres: vi.fn() }));
vi.mock('./tv-shows', () => ({ fetchAvailableTvGenres: vi.fn() }));

import { validateGenreForMediaType } from './media-actions';
import { fetchAvailableGenres } from './movies';
import { fetchAvailableTvGenres } from './tv-shows';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('validateGenreForMediaType', () => {
  it('reads movie genres for the movie media type and matches by string id', async () => {
    vi.mocked(fetchAvailableGenres).mockResolvedValue([{ id: 28, name: 'Action' }] as never);

    expect(await validateGenreForMediaType('28', 'movie')).toBe(true);
    expect(fetchAvailableGenres).toHaveBeenCalledTimes(1);
    expect(fetchAvailableTvGenres).not.toHaveBeenCalled();
  });

  it('reads tv genres for the tv media type', async () => {
    vi.mocked(fetchAvailableTvGenres).mockResolvedValue([{ id: 10759, name: 'A&A' }] as never);

    expect(await validateGenreForMediaType('10759', 'tv')).toBe(true);
    expect(fetchAvailableTvGenres).toHaveBeenCalledTimes(1);
    expect(fetchAvailableGenres).not.toHaveBeenCalled();
  });

  it('returns false when the genre id is not in the available set', async () => {
    vi.mocked(fetchAvailableGenres).mockResolvedValue([{ id: 28, name: 'Action' }] as never);
    expect(await validateGenreForMediaType('99', 'movie')).toBe(false);
  });

  it('fails open (returns true) and warns when the fetch throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(fetchAvailableGenres).mockRejectedValue(new Error('TMDB down'));

    expect(await validateGenreForMediaType('28', 'movie')).toBe(true);
    expect(warn).toHaveBeenCalledOnce();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
