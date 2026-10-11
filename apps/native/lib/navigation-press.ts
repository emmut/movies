export type NavigationPress = {
  defaultPrevented?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  button?: number;
};
export function shouldRememberNavigation(event: NavigationPress = {}) {
  const modified = [event.metaKey, event.ctrlKey, event.altKey, event.shiftKey].some(Boolean);
  return !event.defaultPrevented && !modified && (event.button === undefined || event.button === 0);
}
