import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import LoginLoading from './loading';

describe('login loading skeleton', () => {
  it('reserves the complete loaded login layout', () => {
    const markup = renderToStaticMarkup(<LoginLoading />);

    expect(markup.match(/data-slot="login-feature-skeleton"/g)).toHaveLength(3);
    expect(markup.match(/data-slot="login-action-skeleton"/g)).toHaveLength(4);
    expect(markup.match(/data-slot="login-separator-skeleton"/g)).toHaveLength(2);
    expect(markup).toContain('data-slot="login-auth-hint-skeleton"');
    expect(markup).toContain('data-slot="login-terms-skeleton"');
  });

  it('matches the loaded text and button line boxes', () => {
    const markup = renderToStaticMarkup(<LoginLoading />);

    expect(markup).toContain('data-slot="login-subtitle-skeleton"');
    expect(markup.match(/h-12 w-full/g)).toHaveLength(4);
    expect(markup.match(/h-5 w-/g)?.length).toBeGreaterThanOrEqual(4);
    expect(markup.match(/h-4 w-/g)?.length).toBeGreaterThanOrEqual(6);
  });
});
