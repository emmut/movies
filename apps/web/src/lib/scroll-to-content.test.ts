import { afterEach, describe, expect, it, vi } from 'vitest';

import { scheduleScrollToContent, scrollToContentIfScheduled } from './scroll-to-content';

function stubBrowser({
  url,
  contentElement,
}: {
  url: string;
  contentElement: { scrollIntoView: () => void; getBoundingClientRect?: () => void } | null;
}) {
  const results = contentElement && {
    getBoundingClientRect: vi.fn(),
    ...contentElement,
  };
  const location = { href: url };
  const bodyStyle = { minHeight: '' };
  vi.stubGlobal('window', { location });
  vi.stubGlobal('document', {
    body: { style: bodyStyle },
    documentElement: { scrollHeight: 2400 },
    getElementById: vi.fn(function getElementById(id: string) {
      return id === 'content' ? results : null;
    }),
  });

  return { bodyStyle, location };
}

afterEach(function resetModuleState() {
  // Drain any schedule left behind so tests stay independent: a render away
  // from the scheduled destination clears it.
  stubBrowser({ url: 'http://app.test/drain', contentElement: null });
  scrollToContentIfScheduled();
  vi.unstubAllGlobals();
});

describe('scrollToContentIfScheduled', () => {
  it('does nothing when no scroll was scheduled', () => {
    const scrollIntoView = vi.fn();
    stubBrowser({ url: 'http://app.test/discover', contentElement: { scrollIntoView } });

    scrollToContentIfScheduled();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('scrolls #content into view once the scheduled destination renders', () => {
    const scrollIntoView = vi.fn();
    stubBrowser({ url: 'http://app.test/discover', contentElement: { scrollIntoView } });

    scheduleScrollToContent('?page=2');
    stubBrowser({ url: 'http://app.test/discover?page=2', contentElement: { scrollIntoView } });
    scrollToContentIfScheduled();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('holds the document height through navigation and releases it before scrolling', () => {
    const scrollIntoView = vi.fn();
    const { bodyStyle, location } = stubBrowser({
      url: 'http://app.test/discover',
      contentElement: { scrollIntoView },
    });

    scheduleScrollToContent('?page=2');
    expect(bodyStyle.minHeight).toBe('2400px');

    location.href = 'http://app.test/discover?page=2';
    scrollToContentIfScheduled();

    expect(bodyStyle.minHeight).toBe('');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('lays out the new page while the height hold is still in place', () => {
    // Record the hold each time layout is forced, as WebKit lays out on read.
    const holdAtLayout: string[] = [];
    const { bodyStyle, location } = stubBrowser({
      url: 'http://app.test/discover',
      contentElement: {
        scrollIntoView: vi.fn(),
        getBoundingClientRect: vi.fn(function getBoundingClientRect() {
          holdAtLayout.push(bodyStyle.minHeight);
        }),
      },
    });
    scheduleScrollToContent('?page=2');

    location.href = 'http://app.test/discover?page=2';
    scrollToContentIfScheduled();

    expect(holdAtLayout).toEqual(['2400px']);
    expect(bodyStyle.minHeight).toBe('');
  });

  it('consumes the schedule so a later render does not scroll again', () => {
    const scrollIntoView = vi.fn();
    stubBrowser({ url: 'http://app.test/discover?page=2', contentElement: { scrollIntoView } });

    scheduleScrollToContent('?page=2');
    scrollToContentIfScheduled();
    scrollToContentIfScheduled();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('keeps the schedule while #content is missing and scrolls once it mounts', () => {
    stubBrowser({ url: 'http://app.test/lists?page=3', contentElement: null });

    scheduleScrollToContent('/lists?page=3');
    expect(scrollToContentIfScheduled).not.toThrow();

    const scrollIntoView = vi.fn();
    stubBrowser({ url: 'http://app.test/lists?page=3', contentElement: { scrollIntoView } });
    scrollToContentIfScheduled();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('does not scroll when a superseding query state lands on the same page number', () => {
    stubBrowser({ url: 'http://app.test/discover?page=2', contentElement: null });
    scheduleScrollToContent('?page=1');

    // A filter change also resolves to a page-1 result set on the same
    // pathname — that is a different destination, not the scheduled one.
    const scrollIntoView = vi.fn();
    stubBrowser({
      url: 'http://app.test/discover?page=1&sort_by=vote_average.desc',
      contentElement: { scrollIntoView },
    });
    scrollToContentIfScheduled();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('matches the destination regardless of query parameter order', () => {
    const scrollIntoView = vi.fn();
    stubBrowser({ url: 'http://app.test/discover?mediaType=tv&page=1', contentElement: null });
    scheduleScrollToContent('?mediaType=tv&page=2');

    stubBrowser({
      url: 'http://app.test/discover?page=2&mediaType=tv',
      contentElement: { scrollIntoView },
    });
    scrollToContentIfScheduled();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('drops an abandoned schedule instead of scrolling an unrelated page', () => {
    stubBrowser({ url: 'http://app.test/discover', contentElement: null });
    scheduleScrollToContent('?page=3');

    // The navigation never landed; the next render happens elsewhere.
    const scrollIntoView = vi.fn();
    stubBrowser({ url: 'http://app.test/watchlist', contentElement: { scrollIntoView } });
    scrollToContentIfScheduled();
    expect(scrollIntoView).not.toHaveBeenCalled();

    // Even reaching the original destination later must not scroll — the
    // stale schedule was cleared by the unrelated render.
    stubBrowser({ url: 'http://app.test/discover?page=3', contentElement: { scrollIntoView } });
    scrollToContentIfScheduled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
