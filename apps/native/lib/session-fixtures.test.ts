import { sessionResponse } from '@native/e2e/session-fixtures';
import { expect, it } from 'vite-plus/test';

it('keeps account-security fixture mutations out of subsequent session responses', () => {
  const registered = sessionResponse();
  registered.user.isAnonymous = false;
  registered.user.id = 'registered-account';

  const anonymous = sessionResponse();
  expect(anonymous.user.isAnonymous).toBe(true);
  expect(anonymous.user.id).toBe(anonymous.session.userId);
  expect(anonymous.user).not.toBe(registered.user);
});
