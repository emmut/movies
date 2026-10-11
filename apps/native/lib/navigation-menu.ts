export const PRIMARY_MENU_ITEMS = [
  { id: 'home', label: 'Home', symbol: 'house', path: '/' },
  { id: 'discover', label: 'Discover', symbol: 'sparkles', path: '/discover' },
  { id: 'search', label: 'Search', symbol: 'magnifyingglass', path: '/search' },
] as const;

// Real web workflows remain available while their native screens are ported.
export const MORE_MENU_ITEMS = [
  { id: 'watchlist', label: 'Watchlist', symbol: 'star', path: '/watchlist' },
  { id: 'watched', label: 'Watched', symbol: 'eye', path: '/watched' },
  { id: 'lists', label: 'Lists', symbol: 'list.bullet', path: '/lists' },
  { id: 'settings', label: 'Settings', symbol: 'gearshape', path: '/settings' },
  { id: 'login', label: 'Sign in', symbol: 'person.crop.circle', path: '/login' },
] as const;
const allItems = [...PRIMARY_MENU_ITEMS, ...MORE_MENU_ITEMS];
export type NativeMenuPath =
  | '/'
  | '/discover'
  | '/search'
  | '/login'
  | '/more/settings'
  | '/more/watchlist'
  | '/more/watched';
type MenuDestination = { kind: 'native'; path: NativeMenuPath } | { kind: 'browser'; url: string };

export function getMenuDestination(id: string, webBaseUrl: string): MenuDestination | null {
  if (id === 'watchlist') {
    return { kind: 'native', path: '/more/watchlist' };
  }
  if (id === 'watched') {
    return { kind: 'native', path: '/more/watched' };
  }
  if (id === 'settings') {
    return { kind: 'native', path: '/more/settings' };
  }
  if (id === 'discover') {
    return { kind: 'native', path: '/discover' };
  }
  if (id === 'search') {
    return { kind: 'native', path: '/search' };
  }
  if (id === 'home') {
    return { kind: 'native', path: '/' };
  }
  if (id === 'login') {
    return { kind: 'native', path: '/login' };
  }
  const item = allItems.find((entry) => entry.id === id);
  if (!item) {
    return null;
  }
  return { kind: 'browser', url: `${webBaseUrl.replace(/\/$/, '')}${item.path}` };
}
