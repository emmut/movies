import { mutationEventSchema } from '@movies/api/mutation-effects';
import { verifyCacheEvent } from '@movies/auth/cache-events';

import { ENV } from '@/env';
import { invalidateApiMutation } from '@/lib/api-cache-invalidation';

export async function POST(request: Request) {
  const body = await request.text();
  if (!verifyCacheEvent(body, request.headers, ENV.BETTER_AUTH_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }
  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    return new Response('Invalid event', { status: 400 });
  }
  const event = mutationEventSchema.safeParse(input);
  if (!event.success) {
    return new Response('Invalid event', { status: 400 });
  }
  invalidateApiMutation(event.data);
  return new Response(null, { status: 204 });
}
