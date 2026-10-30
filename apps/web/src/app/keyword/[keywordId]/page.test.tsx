import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('not found');
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(url);
  }),
}));

import KeywordPage from './page';

describe('legacy keyword links', () => {
  it('redirects to Discover preserving the media type and page', async () => {
    await expect(
      KeywordPage({
        params: Promise.resolve({ keywordId: '818' }),
        searchParams: Promise.resolve({ mediaType: 'tv', page: '2' }),
      }),
    ).rejects.toThrow('/discover?keywordId=818&mediaType=tv&page=2');
  });

  it('keeps invalid keyword links as not found', async () => {
    await expect(
      KeywordPage({
        params: Promise.resolve({ keywordId: 'invalid' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('not found');
  });
});
