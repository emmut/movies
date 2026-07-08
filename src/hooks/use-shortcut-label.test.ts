import { describe, expect, it } from 'vitest';

import { formatShortcut } from './use-shortcut-label';

describe('formatShortcut', () => {
  it('uses the command symbol on Apple platforms', () => {
    expect(formatShortcut('MacIntel', 'K')).toBe('⌘K');
    expect(formatShortcut('iPhone', '↵')).toBe('⌘↵');
    expect(formatShortcut('iPad', 'K')).toBe('⌘K');
  });

  it('uses Ctrl elsewhere', () => {
    expect(formatShortcut('Win32', 'K')).toBe('Ctrl+K');
    expect(formatShortcut('Linux x86_64', '↵')).toBe('Ctrl+↵');
  });

  it('defaults to Ctrl for unknown platforms', () => {
    expect(formatShortcut('', 'K')).toBe('Ctrl+K');
  });
});
