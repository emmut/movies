import {
  getMenuDestination,
  MORE_MENU_ITEMS,
  PRIMARY_MENU_ITEMS,
} from '@native/lib/navigation-menu';
import { describe, expect, it } from 'vite-plus/test';

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
    expect(getMenuDestination('home')).toEqual({ kind: 'native', path: '/' });
  });
  it('routes Lists natively', () => {
    expect(getMenuDestination('lists')).toEqual({ kind: 'native', path: '/more/lists' });
  });
  it('routes Discover natively', () => {
    expect(getMenuDestination('discover')).toEqual({ kind: 'native', path: '/discover' });
  });
  it('routes Sign in natively', () => {
    expect(getMenuDestination('login')).toEqual({ kind: 'native', path: '/login' });
  });
  it('routes Search natively', () => {
    expect(getMenuDestination('search')).toEqual({ kind: 'native', path: '/search' });
  });
  it('routes Settings natively', () => {
    expect(getMenuDestination('settings')).toEqual({ kind: 'native', path: '/more/settings' });
  });
  it('does not treat arbitrary OS action IDs as links', () => {
    expect(getMenuDestination('https://attacker.example')).toBeNull();
  });
});

it.each(['watchlist', 'watched'])('routes %s natively', (id) => {
  expect(getMenuDestination(id)).toEqual({ kind: 'native', path: '/more/' + id });
});

it('keeps every menu workflow native', () => {
  for (const item of [...PRIMARY_MENU_ITEMS, ...MORE_MENU_ITEMS]) {
    expect(getMenuDestination(item.id)?.kind).toBe('native');
  }
});
