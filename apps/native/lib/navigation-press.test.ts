import { shouldRememberNavigation } from '@native/lib/navigation-press';
import { describe, expect, it } from 'vite-plus/test';

describe('capturing source scroll before in-app navigation', () => {
  it('captures native touches and ordinary browser/keyboard activations', () => {
    expect(shouldRememberNavigation()).toBe(true);
    expect(shouldRememberNavigation({ button: 0 })).toBe(true);
  });
  it.each([
    { metaKey: true },
    { ctrlKey: true },
    { altKey: true },
    { shiftKey: true },
    { button: 1 },
    { button: 2 },
    { defaultPrevented: true },
  ])('leaves browser-managed or cancelled links alone %j', (event) => {
    expect(shouldRememberNavigation(event)).toBe(false);
  });
});
