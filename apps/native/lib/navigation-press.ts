export type NavigationPress = {
  defaultPrevented?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  button?: number;
};

function hasModifierKey(event: NavigationPress) {
  return Boolean(event.metaKey || event.ctrlKey || event.altKey || event.shiftKey);
}

function isPrimaryButton(event: NavigationPress) {
  return event.button === undefined || event.button === 0;
}

export function shouldRememberNavigation(event: NavigationPress = {}) {
  if (event.defaultPrevented || hasModifierKey(event)) {
    return false;
  }
  return isPrimaryButton(event);
}
