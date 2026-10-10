import { describe, expect, it } from 'vitest';

import {
  catalogRelatedInput,
  catalogTitleInput,
  pickYoutubeTrailer,
  trailerEmbedUrl,
} from './catalog-support';

const key = 'AbCdEfGhI_1';
describe('catalog supporting rules', () => {
  it('selects the first playable trailer or teaser in upstream order', () => {
    expect(
      pickYoutubeTrailer([
        { key, type: 'Clip', site: 'YouTube' },
        { key, type: 'Trailer', site: 'Vimeo' },
        { key: '../invalid', type: 'Trailer', site: 'YouTube' },
        { key, type: 'Teaser', site: 'YouTube' },
        { key: '12345678901', type: 'Trailer', site: 'YouTube' },
      ]),
    ).toBe(key);
    expect(pickYoutubeTrailer([{ key, type: 'Trailer', site: 'YouTube' }])).toBe(key);
  });
  it('does not invent a trailer when none is playable', () => {
    expect(pickYoutubeTrailer([])).toBeNull();
    expect(pickYoutubeTrailer([{ key: 'bad', type: 'Trailer', site: 'YouTube' }])).toBeNull();
  });
  it('builds a fixed-host embed URL and rejects path/query injection', () => {
    expect(trailerEmbedUrl(key)).toBe(
      `https://www.youtube.com/embed/${key}?autoplay=1&playsinline=1`,
    );
    expect(() => trailerEmbedUrl('x?autoplay=0')).toThrow();
  });
  it('keeps title-only calls free of irrelevant region inputs', () => {
    expect(catalogTitleInput.parse({ id: 42, type: 'movie', region: 'SE' })).toEqual({
      id: 42,
      type: 'movie',
    });
  });
  it('validates related kind and applies the canonical region default', () => {
    expect(catalogRelatedInput.parse({ id: 42, type: 'tv', kind: 'similar' })).toEqual({
      id: 42,
      type: 'tv',
      kind: 'similar',
      region: 'SE',
    });
    expect(catalogRelatedInput.safeParse({ id: 42, type: 'tv', kind: 'credits' }).success).toBe(
      false,
    );
  });
});
