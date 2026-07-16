import { afterEach, describe, expect, it, vi } from 'vitest';

import { scrollToContent } from './scroll-to-content';

function stubEnv(container: { scrollIntoView: ReturnType<typeof vi.fn> } | null) {
  const scrollTo = vi.fn();
  vi.stubGlobal('document', { querySelector: vi.fn().mockReturnValue(container) });
  vi.stubGlobal('window', { scrollTo });
  return { scrollTo };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('scrollToContent', () => {
  it('scrolls the results container to the top', () => {
    const scrollIntoView = vi.fn();
    stubEnv({ scrollIntoView });

    scrollToContent();

    expect(scrollIntoView).toHaveBeenCalledWith();
  });

  it('falls back to the top of the page when no container is present', () => {
    const { scrollTo } = stubEnv(null);

    scrollToContent();

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
