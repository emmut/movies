import { cacheEventHeaders } from '@movies/auth/cache-events';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { ENV } from '@/env';
import { invalidateApiMutation } from '@/lib/api-cache-invalidation';

import { POST } from './route';

vi.mock('@/lib/api-cache-invalidation', () => ({ invalidateApiMutation: vi.fn() }));
afterEach(() => vi.clearAllMocks());
function request(body: string) {
  return new Request('http://localhost/api/internal/invalidate', {
    method: 'POST',
    body,
    headers: cacheEventHeaders(body, ENV.BETTER_AUTH_SECRET),
  });
}
it('rejects signed malformed JSON without invalidating', async () => {
  expect((await POST(request('{broken'))).status).toBe(400);
  expect(invalidateApiMutation).not.toHaveBeenCalled();
});
it.each([
  { domain: 'unknown', userId: 'owner' },
  { domain: 'preferences' },
  { domain: 'systemLists', userId: 'owner', listType: 'custom' },
  { domain: 'customLists', userId: 'owner', listId: 'invalid' },
  {
    domain: 'systemLists',
    userId: 'owner',
    listType: 'watchlist',
    resource: { resourceId: -1, resourceType: 'movie' },
  },
])('rejects a signed event outside the domain contract', async (event) => {
  expect((await POST(request(JSON.stringify(event)))).status).toBe(400);
  expect(invalidateApiMutation).not.toHaveBeenCalled();
});
it.each([
  { domain: 'preferences', userId: 'owner' },
  { domain: 'customLists', userId: 'owner', listId: '00000000-0000-4000-8000-000000000001' },
  {
    domain: 'systemLists',
    userId: 'owner',
    listType: 'watched',
    resource: { resourceType: 'tv', resourceId: 7 },
  },
])('invalidates a valid signed event and returns 204', async (event) => {
  expect((await POST(request(JSON.stringify(event)))).status).toBe(204);
  expect(invalidateApiMutation).toHaveBeenCalledWith(event);
});
