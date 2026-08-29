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
    expect(getMediaTypeUrlUpdate('tv', [], movieGenres, tvGenres)).toEqual({
      mediaType: 'tv',
      page: '1',
    });
  });

  it('keeps selected genres when they all exist for the target media type', () => {
    expect(getMediaTypeUrlUpdate('tv', [35], movieGenres, tvGenres)).toEqual({
      mediaType: 'tv',
      page: '1',
    });
  });

  it('drops only the genres missing from the target media type', () => {
    expect(getMediaTypeUrlUpdate('tv', [28, 35], movieGenres, tvGenres)).toEqual({
      mediaType: 'tv',
      genreIds: [35],
      page: '1',
    });
  });

  it('clears the selection when no genre exists for the target media type', () => {
    expect(getMediaTypeUrlUpdate('tv', [28], movieGenres, tvGenres)).toEqual({
      mediaType: 'tv',
      genreIds: [],
      page: '1',
    });
  });

  it('preserves genre state when no target genre list is available', () => {
    expect(getMediaTypeUrlUpdate('movie', [28])).toEqual({
      mediaType: 'movie',
      page: '1',
    });
  });
});
