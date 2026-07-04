import { describe, expect, it } from 'vitest';

import { getMediaTypeUrlUpdate } from './media-type-selector';

const movieGenres = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
];

const tvGenres = [
  { id: 35, name: 'Comedy' },
  { id: 10759, name: 'Action & Adventure' },
];

describe('getMediaTypeUrlUpdate', () => {
  it('resets pagination when switching media type', () => {
    expect(getMediaTypeUrlUpdate('tv', 0, movieGenres, tvGenres)).toEqual({
      mediaType: 'tv',
      page: '1',
    });
  });

  it('keeps a selected genre when it exists for the target media type', () => {
    expect(getMediaTypeUrlUpdate('tv', 35, movieGenres, tvGenres)).toEqual({
      mediaType: 'tv',
      page: '1',
    });
  });

  it('clears a selected genre when it is missing from the target media type', () => {
    expect(getMediaTypeUrlUpdate('tv', 28, movieGenres, tvGenres)).toEqual({
      mediaType: 'tv',
      genreId: 0,
      page: '1',
    });
  });

  it('preserves genre state when no target genre list is available', () => {
    expect(getMediaTypeUrlUpdate('movie', 28)).toEqual({
      mediaType: 'movie',
      page: '1',
    });
  });
});
