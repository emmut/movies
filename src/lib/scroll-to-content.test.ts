import { afterEach, describe, expect, it, vi } from 'vitest';

import { scheduleScrollToContent, scrollToContentIfScheduled } from './scroll-to-content';

function stubDocument(contentElement: { scrollIntoView: () => void } | null) {
  const getElementById = vi.fn(function getElementById(id: string) {
    return id === 'content' ? contentElement : null;
  });
  vi.stubGlobal('document', { getElementById });
  return getElementById;
}

afterEach(function resetModuleState() {
  // Drain any schedule left behind so tests stay independent.
  stubDocument(null);
  scrollToContentIfScheduled();
  vi.unstubAllGlobals();
});

describe('scrollToContentIfScheduled', () => {
  it('does nothing when no scroll was scheduled', () => {
    const getElementById = stubDocument({ scrollIntoView: vi.fn() });

    scrollToContentIfScheduled();

    expect(getElementById).not.toHaveBeenCalled();
  });

  it('scrolls #content into view once a scroll was scheduled', () => {
    const scrollIntoView = vi.fn();
    stubDocument({ scrollIntoView });

    scheduleScrollToContent();
    scrollToContentIfScheduled();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('consumes the schedule so a later render does not scroll again', () => {
    const scrollIntoView = vi.fn();
    stubDocument({ scrollIntoView });

    scheduleScrollToContent();
    scrollToContentIfScheduled();
    scrollToContentIfScheduled();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('tolerates a missing #content element', () => {
    stubDocument(null);

    scheduleScrollToContent();

    expect(scrollToContentIfScheduled).not.toThrow();
  });
});
