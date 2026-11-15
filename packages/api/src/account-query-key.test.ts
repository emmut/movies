import { describe, expect, it } from 'vite-plus/test';

import { accountPlaceholderData } from './account-query-key';

describe('account pagination placeholders', () => {
  it('keeps the previous page for the same account only', () => {
    const page = { items: ['private'] };
    const previous = { queryKey: ['account', 'alice', 'page', 1] };
    expect(accountPlaceholderData(page, previous, 'alice')).toBe(page);
    expect(accountPlaceholderData(page, previous, 'bob')).toBeUndefined();
    expect(accountPlaceholderData(page, previous, null)).toBeUndefined();
    expect(accountPlaceholderData(page, undefined, 'alice')).toBeUndefined();
  });
});
