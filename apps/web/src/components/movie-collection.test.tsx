import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/components/image-proxy', () => ({ Imgproxy: () => null }));
vi.mock('@/lib/pdp', () => ({ getCollection: vi.fn() }));

import { getCollection } from '@/lib/pdp';

import { MovieCollection } from './movie-collection';

beforeEach(() => vi.clearAllMocks());
describe('Movie collection', () => {
  it('hides collections with no other movies', async () => {
    vi.mocked(getCollection).mockResolvedValue({
      name: 'Collection',
      parts: [{ id: 1, title: 'Current', release_date: '', poster_path: null }],
    });
    expect(await MovieCollection({ collectionId: 1, currentId: 1 })).toBeNull();
  });

  it('places undated movies after dated movies without changing the source order', async () => {
    const parts = [
      { id: 3, title: 'Undated', release_date: '', poster_path: null },
      { id: 2, title: 'Dated', release_date: '2010-01-01', poster_path: null },
    ];
    vi.mocked(getCollection).mockResolvedValue({ name: 'Collection', parts });
    const html = renderToStaticMarkup(await MovieCollection({ collectionId: 1, currentId: 1 }));
    expect(html.indexOf('Dated')).toBeLessThan(html.indexOf('Undated'));
    expect(parts[0].id).toBe(3);
  });

  it('excludes the current movie and orders other collection movies chronologically', async () => {
    vi.mocked(getCollection).mockResolvedValue({
      name: 'Collection',
      parts: [
        { id: 1, title: 'Current', release_date: '2000-01-01', poster_path: null },
        { id: 3, title: 'Later', release_date: '2020-01-01', poster_path: null },
        { id: 2, title: 'Earlier', release_date: '2010-01-01', poster_path: null },
      ],
    });
    const section = await MovieCollection({ collectionId: 1, currentId: 1 });
    const html = renderToStaticMarkup(section);
    expect(html).not.toContain('Current');
    expect(html.indexOf('Earlier')).toBeLessThan(html.indexOf('Later'));
    expect(html).toContain('/movie/2');
  });
});
