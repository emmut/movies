import { classifySessionChange } from '@native/lib/session-change';
import { describe, expect, it } from 'vitest';

describe('session change', () => {
  it('treats the first settled session as the baseline', () => {
    expect(classifySessionChange(undefined, 'user-1')).toBe('none');
    expect(classifySessionChange(undefined, null)).toBe('none');
  });
  it('ignores an unchanged session', () => {
    expect(classifySessionChange('user-1', 'user-1')).toBe('none');
  });
  it('distinguishes sign-in or account switches from sign-out', () => {
    expect(classifySessionChange(null, 'user-1')).toBe('account-changed');
    expect(classifySessionChange('user-1', 'user-2')).toBe('account-changed');
    expect(classifySessionChange('user-1', null)).toBe('signed-out');
  });
});
