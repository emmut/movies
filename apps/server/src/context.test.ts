import { createContext } from '@server/context';
import { mockAuth } from '@server/test-auth';
import { mockServices } from '@server/test-services';
import { expect, it, vi } from 'vite-plus/test';

it('exposes only public user fields from the inferred Better Auth session', async () => {
  const user = {
    id: 'owner',
    name: 'Owner',
    email: 'owner@example.com',
    image: null,
    isAnonymous: true,
  };
  const auth = mockAuth(user);
  const headers = new Headers({ cookie: 'test-session' });
  const context = createContext(mockServices(), headers, auth);
  expect(auth.api.getSession).not.toHaveBeenCalled();
  expect(await context.session?.current()).toEqual(user);
  expect(auth.api.getSession).toHaveBeenCalledWith({
    headers,
    query: { disableCookieCache: true },
  });
});

it('distinguishes absent sessions, disabled auth and database failures', async () => {
  const services = mockServices();
  expect(createContext(services, new Headers()).session).toBeUndefined();
  const auth = mockAuth();
  const context = createContext(services, new Headers(), auth);
  expect(await context.session?.current()).toBeNull();
  vi.mocked(auth.api.getSession).mockRejectedValue(new Error('database unavailable'));
  await expect(context.session?.current()).rejects.toThrow('database unavailable');
});
