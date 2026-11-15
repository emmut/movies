import { describe, expect, it } from 'vite-plus/test';

import { readKeywordInput } from './keyword-model';

describe('keyword route input', () => {
  it('defaults type/page and uses the account region', () => {
    expect(readKeywordInput({ keywordId: '9' }, 'SE')).toMatchObject({
      success: true,
      data: { id: 9, type: 'movie', page: 1, region: 'SE' },
    });
  });
  it('retains TV, page and a validated region override', () => {
    expect(
      readKeywordInput({ keywordId: '9', mediaType: 'tv', page: '500', region: 'US' }, 'SE'),
    ).toMatchObject({
      success: true,
      data: { id: 9, type: 'tv', page: 500, region: 'US' },
    });
    expect(readKeywordInput({ keywordId: '9', region: 'invalid' }, 'SE')).toMatchObject({
      success: true,
      data: { region: 'SE' },
    });
  });
  it.each([
    { keywordId: '0' },
    { keywordId: '1e2' },
    { keywordId: ['9', '10'] },
    { keywordId: '9', page: '0' },
    { keywordId: '9', page: '501' },
    { keywordId: '9', page: '1.5' },
    { keywordId: '9', mediaType: 'person' },
  ])('rejects invalid IDs, pages and media types: %j', (params) => {
    expect(readKeywordInput(params, 'SE').success).toBe(false);
  });
});
