import { describe, expect, it } from 'vite-plus/test';

import { keywordRouteSchema, seasonRouteSchema } from './pdp-route-params';

describe('PDP route validation', () => {
  it('converts valid resource IDs and allows season zero for specials', () => {
    expect(seasonRouteSchema.parse({ tvId: '1668', seasonNumber: '0' })).toEqual({
      tvId: 1668,
      seasonNumber: 0,
    });
    expect(keywordRouteSchema.parse({ keywordId: '10', page: 500, mediaType: 'tv' })).toEqual({
      keywordId: 10,
      page: 500,
      mediaType: 'tv',
    });
  });
  it.each(['', '0', '-1', '1.5', '1e3', ' 1', '12abc', '9007199254740992'])(
    'rejects invalid resource ID %j',
    (id) => {
      expect(
        keywordRouteSchema.safeParse({ keywordId: id, page: 1, mediaType: 'movie' }).success,
      ).toBe(false);
      expect(seasonRouteSchema.safeParse({ tvId: id, seasonNumber: '1' }).success).toBe(false);
    },
  );
  it.each(['-1', '1.5', '1e3', '', '9007199254740992'])(
    'rejects invalid season number %j',
    (seasonNumber) => {
      expect(seasonRouteSchema.safeParse({ tvId: '1', seasonNumber }).success).toBe(false);
    },
  );
  it.each([0, -1, 501, 1.5, NaN, Infinity])('rejects invalid page %j', (page) => {
    expect(keywordRouteSchema.safeParse({ keywordId: '1', page, mediaType: 'movie' }).success).toBe(
      false,
    );
  });
});
