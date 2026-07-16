import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { scrollToContent } from './scroll-to-content';

function stubEnv(container: { scrollIntoView: ReturnType<typeof vi.fn> } | null) {
  const scrollTo = vi.fn();
  vi.stubGlobal('document', { querySelector: vi.fn().mockReturnValue(container) });
  vi.stubGlobal('window', { scrollTo });
  return { scrollTo };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('scrollToContent', () => {
  it('scrolls the results container to the top', () => {
    const scrollIntoView = vi.fn();
    stubEnv({ scrollIntoView });

    scrollToContent();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('falls back to the top of the page when no container is present', () => {
    const { scrollTo } = stubEnv(null);

    scrollToContent();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('re-asserts the target after WebKit settles', () => {
    const scrollIntoView = vi.fn();
    stubEnv({ scrollIntoView });

    scrollToContent();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(350);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });
});
