'use client';

import { useIsClient } from './use-is-client';

const APPLE_PLATFORM_PATTERN = /mac|iphone|ipad|ipod/i;

/**
 * Formats a keyboard shortcut for the given platform: "⌘K" on Apple
 * platforms, "Ctrl+K" everywhere else.
 */
export function formatShortcut(platform: string, key: string): string {
  return APPLE_PLATFORM_PATTERN.test(platform) ? `⌘${key}` : `Ctrl+${key}`;
}

/**
 * Platform-aware shortcut label. Renders the Apple form on the server and
 * first client paint (no navigator there), then corrects after mount —
 * the standard hydration-safe pattern for platform detection.
 */
export function useShortcutLabel(key: string): string {
  const isClient = useIsClient();
  return formatShortcut(isClient ? navigator.platform : 'mac', key);
}
