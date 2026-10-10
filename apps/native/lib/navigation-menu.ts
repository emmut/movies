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
type MenuDestination =
  | { kind: 'native'; path: '/' | '/discover' }
  | { kind: 'browser'; url: string };

export function getMenuDestination(id: string, webBaseUrl: string): MenuDestination | null {
  if (id === 'discover') return { kind: 'native', path: '/discover' };
  if (id === 'home') return { kind: 'native', path: '/' };
  const item = allItems.find((entry) => entry.id === id);
  if (!item) return null;
  return { kind: 'browser', url: `${webBaseUrl.replace(/\/$/, '')}${item.path}` };
}
