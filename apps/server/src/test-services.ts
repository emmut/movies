import type { AppRouterClient, AppServices } from '@movies/api/router';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { createApp } from '@server/app';
import { vi } from 'vitest';

/** Every host service as an inert mock; tests replace the ones they exercise. */
export function mockServices(overrides: Partial<AppServices> = {}): AppServices {
  return {
    systemLists: {
      options: vi.fn(),
      page: vi.fn(),
      memberships: vi.fn(),
      toggle: vi.fn(),
      move: vi.fn(),
    },
    preferences: {
      region: vi.fn(),
      setRegion: vi.fn(),
      providers: vi.fn(),
      setProviders: vi.fn(),
      providerOptions: vi.fn(),
    },
    person: { details: vi.fn(), credits: vi.fn() },
    search: { list: vi.fn() },
    discovery: { list: vi.fn(), options: vi.fn() },
    home: { list: vi.fn(), trending: vi.fn() },
    catalog: { details: vi.fn(), trailer: vi.fn(), providers: vi.fn(), related: vi.fn() },
    ...overrides,
  };
}

/** A typed oRPC client that sends requests straight into the Hono app. */
export function createTestClient(
  app: ReturnType<typeof createApp>,
  headers?: Record<string, string>,
): AppRouterClient {
  return createORPCClient(
    new RPCLink({
      url: 'http://localhost/rpc',
      headers,
      fetch: async (request, init) => app.request(request, init),
    }),
  );
}
