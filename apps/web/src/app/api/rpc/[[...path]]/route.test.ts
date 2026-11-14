import type { AppContext } from '@movies/api/router';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { invalidateApiMutation } from '@/lib/api-cache-invalidation';
import { createApiContext } from '@/lib/api-server';

import { POST } from './route';

vi.mock('@/lib/api-server', () => ({ createApiContext: vi.fn() }));
vi.mock('@/lib/api-cache-invalidation', () => ({ invalidateApiMutation: vi.fn() }));
const current = vi.fn();
const create = vi.fn();
const context = { session: { current }, customLists: { create } } as unknown as AppContext;

function request(path: string, input: unknown) {
  return new Request(`http://localhost/api/rpc/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ json: input }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createApiContext).mockReturnValue(context);
  current.mockResolvedValue({ id: 'owner' });
  create.mockResolvedValue({ success: true, listId: '00000000-0000-4000-8000-000000000001' });
});

describe('web same-origin RPC', () => {
  it('validates writes and invalidates server renders after successful execution', async () => {
    const input = { name: ' Favorites ', userId: 'forged' };
    const response = await POST(request('customLists/create', input));
    expect(response.status).toBe(200);
    expect(create).toHaveBeenCalledWith('owner', {
      name: 'Favorites',
      description: '',
      emoji: '📝',
    });
    expect(invalidateApiMutation).toHaveBeenCalledWith('/customLists/create', input, context);
  });
  it('rejects anonymous private writes without invalidating cached renders', async () => {
    current.mockResolvedValue(null);
    const response = await POST(request('customLists/create', { name: 'Favorites' }));
    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
    expect(invalidateApiMutation).not.toHaveBeenCalled();
  });
  it('rejects malformed input without executing or invalidating', async () => {
    const response = await POST(request('customLists/create', { name: '' }));
    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
    expect(invalidateApiMutation).not.toHaveBeenCalled();
  });
  it('returns 404 for an unknown procedure', async () => {
    expect((await POST(request('missing', {}))).status).toBe(404);
    expect(invalidateApiMutation).not.toHaveBeenCalled();
  });
});
