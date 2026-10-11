import type { SessionUser } from '@movies/api/session';
import { createApp } from '@server/app';
import type { AuthGateway } from '@server/auth-gateway';
import { createTestClient, mockServices } from '@server/test-services';
import { describe, expect, it, vi } from 'vitest';

const user: SessionUser = {
  id: 'user-1',
  name: 'Ada',
  email: 'ada@example.com',
  image: null,
  isAnonymous: false,
};

function setup(current: AuthGateway['current'] | undefined) {
  const preferences = {
    providers: vi.fn().mockResolvedValue({ providerIds: [8] }),
    setProviders: vi.fn().mockImplementation(async (_userId, input) => input),
    providerOptions: vi.fn().mockResolvedValue([]),
    region: vi.fn().mockResolvedValue({ region: 'NO' }),
    setRegion: vi.fn().mockImplementation(async (_userId, input) => input),
  };
  let auth: AuthGateway | undefined;
  if (current) {
    auth = { handle: vi.fn(), current };
  }
  const app = createApp(mockServices({ preferences }), undefined, [], auth);
  return { app, preferences, client: createTestClient(app, { Cookie: 'signed-test-cookie' }) };
}

describe('account preference RPC', () => {
  it('rejects every preference call when auth is not configured', async () => {
    const { client, preferences } = setup(undefined);
    await expect(client.preferences.region()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(client.preferences.setRegion({ region: 'US' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(preferences.region).not.toHaveBeenCalled();
    expect(preferences.setRegion).not.toHaveBeenCalled();
  });
  it('rejects signed-out callers without touching account data', async () => {
    const { client, preferences } = setup(vi.fn().mockResolvedValue(null));
    await expect(client.preferences.setRegion({ region: 'US' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(preferences.setRegion).not.toHaveBeenCalled();
  });
  it('scopes reads and writes to the verified session user', async () => {
    const current = vi.fn().mockResolvedValue(user);
    const { client, preferences } = setup(current);
    expect(await client.preferences.region()).toEqual({ region: 'NO' });
    expect(preferences.region).toHaveBeenCalledWith('user-1');
    expect(await client.preferences.setRegion({ region: 'US' })).toEqual({ region: 'US' });
    expect(preferences.setRegion).toHaveBeenCalledWith('user-1', { region: 'US' });
    expect(current.mock.calls[0][0].get('cookie')).toBe('signed-test-cookie');
  });
  it('ignores a caller-supplied user ID', async () => {
    const { app, preferences } = setup(vi.fn().mockResolvedValue(user));
    const response = await app.request('/rpc/preferences/setRegion', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: 'signed-test-cookie' },
      body: JSON.stringify({ json: { region: 'DK', userId: 'someone-else' } }),
    });
    expect(response.status).toBe(200);
    expect(preferences.setRegion).toHaveBeenCalledWith('user-1', { region: 'DK' });
  });
  it('rejects unsupported regions before writing', async () => {
    const { app, preferences } = setup(vi.fn().mockResolvedValue(user));
    const response = await app.request('/rpc/preferences/setRegion', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: 'signed-test-cookie' },
      body: JSON.stringify({ json: { region: 'XX' } }),
    });
    expect(response.status).toBe(400);
    expect(preferences.setRegion).not.toHaveBeenCalled();
  });
  it('reports a session-host outage as a server error rather than signed-out', async () => {
    const { client } = setup(vi.fn().mockRejectedValue(new Error('Could not verify the session')));
    await expect(client.preferences.region()).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

it('denies provider reads, writes and choices when the session is absent or expired', async () => {
  const { client, preferences } = setup(vi.fn().mockResolvedValue(null));
  await expect(client.preferences.providers()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  await expect(client.preferences.setProviders({ providerIds: [8] })).rejects.toMatchObject({
    code: 'UNAUTHORIZED',
  });
  await expect(client.preferences.providerOptions({ region: 'SE' })).rejects.toMatchObject({
    code: 'UNAUTHORIZED',
  });
  expect(preferences.providers).not.toHaveBeenCalled();
  expect(preferences.setProviders).not.toHaveBeenCalled();
  expect(preferences.providerOptions).not.toHaveBeenCalled();
});
it.each([false, true])(
  'scopes provider reads and complete replacements to session identity (anonymous=%s)',
  async (isAnonymous) => {
    const { client, app, preferences } = setup(vi.fn().mockResolvedValue({ ...user, isAnonymous }));
    expect(await client.preferences.providers()).toEqual({ providerIds: [8] });
    expect(preferences.providers).toHaveBeenCalledWith('user-1');
    const response = await app.request('/rpc/preferences/setProviders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: 'signed-test-cookie' },
      body: JSON.stringify({ json: { providerIds: [9, 8, 8], userId: 'someone-else' } }),
    });
    expect(response.status).toBe(200);
    expect(preferences.setProviders).toHaveBeenCalledWith('user-1', { providerIds: [8, 9] });
    expect(await client.preferences.providerOptions({ region: 'NO' })).toEqual([]);
    expect(preferences.providerOptions).toHaveBeenCalledWith({ region: 'NO' });
  },
);
it.each([0, -1, 1.5, 2_147_483_648, '8'])(
  'rejects invalid provider ID %s before writing',
  async (id) => {
    const { app, preferences } = setup(vi.fn().mockResolvedValue(user));
    const response = await app.request('/rpc/preferences/setProviders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: 'signed-test-cookie' },
      body: JSON.stringify({ json: { providerIds: [id] } }),
    });
    expect(response.status).toBe(400);
    expect(preferences.setProviders).not.toHaveBeenCalled();
  },
);
