import { describe, expect, it } from 'vitest';

import { getMenuDestination, MORE_MENU_ITEMS, PRIMARY_MENU_ITEMS } from './navigation-menu';

describe('native navigation menu destinations', () => {
  it('keeps Home, Discover and Search primary and the rest in overflow', () => {
    expect(PRIMARY_MENU_ITEMS.map((item) => item.id)).toEqual(['home', 'discover', 'search']);
    expect(MORE_MENU_ITEMS.map((item) => item.id)).toEqual([
      'watchlist',
      'watched',
      'lists',
      'settings',
      'login',
    ]);
  });
  it('returns native Home without needing a browser URL', () => {
    expect(getMenuDestination('home', '')).toEqual({ kind: 'native', path: '/' });
  });
  it.each([...PRIMARY_MENU_ITEMS, ...MORE_MENU_ITEMS].filter((item) => item.id !== 'home'))(
    'opens the existing $label workflow until it is ported',
    (item) => {
      expect(getMenuDestination(item.id, 'https://movies.example/')).toEqual({
        kind: 'browser',
        url: `https://movies.example${item.path}`,
      });
    },
  );
  it('preserves an explicit web base path', () => {
    expect(getMenuDestination('discover', 'https://movies.example/app')).toEqual({
      kind: 'browser',
      url: 'https://movies.example/app/discover',
    });
  });
  it('does not treat arbitrary OS action IDs as links', () => {
    expect(getMenuDestination('https://attacker.example', 'https://movies.example')).toBeNull();
  });
});
