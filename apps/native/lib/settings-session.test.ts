import {
  commitSavedSetting,
  isUnauthorized,
  SETTINGS_LOGIN_HREF,
} from '@native/lib/settings-session';
import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vite-plus/test';

describe('native settings session', () => {
  it('returns to settings after sign-in', () => {
    expect(SETTINGS_LOGIN_HREF).toBe('/login?redirect_url=%2Fmore%2Fsettings');
  });
  it('recognises only UNAUTHORIZED errors', () => {
    expect(isUnauthorized(null)).toBe(false);
    expect(isUnauthorized(new Error('offline'))).toBe(false);
    expect(isUnauthorized(Object.assign(new Error('nope'), { code: 'FORBIDDEN' }))).toBe(false);
    expect(isUnauthorized(Object.assign(new Error('nope'), { code: 'UNAUTHORIZED' }))).toBe(true);
  });
  it('caches the saved result, clears the draft, then refetches the key', async () => {
    const client = new QueryClient();
    const queryKey = ['account', 'user-1', 'region'];
    const calls: string[] = [];
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockImplementation(async () => {
      calls.push('invalidate');
    });
    await commitSavedSetting(client, queryKey, { region: 'SE' }, () => {
      calls.push('clear:' + JSON.stringify(client.getQueryData(queryKey)));
    });
    expect(calls).toEqual(['clear:{"region":"SE"}', 'invalidate']);
    expect(invalidate).toHaveBeenCalledWith({ queryKey });
  });
});
