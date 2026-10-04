import { describe, expect, it } from 'vitest';

import { shouldOpenSearch } from './use-search-shortcut';

function event(overrides: Partial<Parameters<typeof shouldOpenSearch>[0]>) {
  return { key: '', metaKey: false, ctrlKey: false, target: null, ...overrides };
}

describe('shouldOpenSearch', () => {
  it('opens on cmd+k', () => {
    expect(shouldOpenSearch(event({ key: 'k', metaKey: true }))).toBe(true);
  });

  it('opens on ctrl+k', () => {
    expect(shouldOpenSearch(event({ key: 'k', ctrlKey: true }))).toBe(true);
  });

  it('ignores a bare k', () => {
    expect(shouldOpenSearch(event({ key: 'k' }))).toBe(false);
  });

  it('opens on slash outside form fields', () => {
    expect(shouldOpenSearch(event({ key: '/', target: { tagName: 'BODY' } }))).toBe(true);
  });

  it('ignores slash while typing in an input', () => {
    expect(shouldOpenSearch(event({ key: '/', target: { tagName: 'INPUT' } }))).toBe(false);
  });

  it('ignores slash while typing in a textarea or select', () => {
    expect(shouldOpenSearch(event({ key: '/', target: { tagName: 'TEXTAREA' } }))).toBe(false);
    expect(shouldOpenSearch(event({ key: '/', target: { tagName: 'SELECT' } }))).toBe(false);
  });

  it('ignores slash inside contenteditable elements', () => {
    expect(
      shouldOpenSearch(event({ key: '/', target: { tagName: 'DIV', isContentEditable: true } })),
    ).toBe(false);
  });

  it('ignores other keys', () => {
    expect(shouldOpenSearch(event({ key: 'p', metaKey: true }))).toBe(false);
  });
});
