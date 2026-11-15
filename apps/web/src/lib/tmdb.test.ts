import { describe, expect, it, vi } from 'vite-plus/test';

import { addPosterImageUrls, addProfileImageUrls, optional } from './tmdb';
vi.mock('@/lib/imgproxy-url', () => ({
  buildProxyImageUrls: vi.fn(() => ({ src: 'proxied', srcSet: 'proxied 1x' })),
}));

describe('optional', () => {
  it('resolves to the fetched value when the promise succeeds', async () => {
    await expect(optional(Promise.resolve({ reviews: ['a'] }), { reviews: [] })).resolves.toEqual({
      reviews: ['a'],
    });
  });

  it('degrades to the fallback when the promise rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fallback = { reviews: [] as string[] };

    await expect(optional(Promise.reject(new Error('504')), fallback)).resolves.toBe(fallback);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

describe('addPosterImageUrls', () => {
  it('returns the item unchanged when there is no poster_path', () => {
    const item = { id: 1, poster_path: null };
    expect(addPosterImageUrls(item)).toBe(item);
  });

  it('adds proxied poster urls when a poster_path is present', () => {
    const result = addPosterImageUrls({ id: 1, poster_path: '/poster.jpg' });
    expect(result).toHaveProperty('posterImageUrls');
  });
});

describe('addProfileImageUrls', () => {
  it('returns the item unchanged when there is no profile_path', () => {
    const item = { id: 1, profile_path: null };
    expect(addProfileImageUrls(item)).toBe(item);
  });

  it('adds proxied profile urls when a profile_path is present', () => {
    const result = addProfileImageUrls({ id: 1, profile_path: '/profile.jpg' });
    expect(result).toHaveProperty('profileImageUrls');
  });
});
