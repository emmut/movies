export const PRIMARY_MENU_ITEMS = [
  { id: 'home', label: 'Home', symbol: 'house', path: '/', nativePath: '/' },
  {
    id: 'discover',
    label: 'Discover',
    symbol: 'sparkles',
    path: '/discover',
    nativePath: '/discover',
  },
  {
    id: 'search',
    label: 'Search',
    symbol: 'magnifyingglass',
    path: '/search',
    nativePath: '/search',
  },
] as const;

export const MORE_MENU_ITEMS = [
  {
    id: 'watchlist',
    label: 'Watchlist',
    symbol: 'star',
    path: '/watchlist',
    nativePath: '/more/watchlist',
  },
  { id: 'watched', label: 'Watched', symbol: 'eye', path: '/watched', nativePath: '/more/watched' },
  { id: 'lists', label: 'Lists', symbol: 'list.bullet', path: '/lists', nativePath: '/more/lists' },
  {
    id: 'settings',
    label: 'Settings',
    symbol: 'gearshape',
    path: '/settings',
    nativePath: '/more/settings',
  },
  {
    id: 'login',
    label: 'Sign in',
    symbol: 'person.crop.circle',
    path: '/login',
    nativePath: '/login',
  },
] as const;
const allItems = [...PRIMARY_MENU_ITEMS, ...MORE_MENU_ITEMS];
type MenuItem = (typeof allItems)[number];
export type NativeMenuPath = Extract<MenuItem, { nativePath: string }>['nativePath'];
type MenuDestination = { kind: 'native'; path: NativeMenuPath };
export function getMenuDestination(id: string): MenuDestination | null {
  const item = allItems.find((entry) => entry.id === id);
  return item ? { kind: 'native', path: item.nativePath } : null;
}
